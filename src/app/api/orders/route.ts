import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'
import { estimateSlaMinutes, haversineKm } from '@/lib/geo'

function toAmount(value: number) {
  return Math.round(value * 100) / 100
}

function jsonResponse(message: string, status = 400) {
  return NextResponse.json({ message }, { status })
}

export async function GET() {
  const prisma = getPrisma()
  const orders = await prisma.customerOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      pharmacyOrders: {
        include: {
          pharmacy: true,
          items: { include: { product: true } },
          prescription: true,
        },
      },
    },
  })

  return NextResponse.json({ orders })
}

export async function POST(request: Request) {
  const prisma = getPrisma()
  const contentType = request.headers.get('content-type') ?? ''

  let customerName = ''
  let customerEmail = ''
  let phone = ''
  let address = ''
  let city = ''
  let postalCode = ''
  let deliveryLatitude: number | null = null
  let deliveryLongitude: number | null = null
  let paymentMethod = 'cash-on-delivery'
  let items: Array<{
    id: string
    name: string
    price: number
    quantity: number
    routeKey: string
    pharmacyId: string
    pharmacyName: string
    requiresPrescription: boolean
  }> = []
  let prescriptionFile: File | null = null
  let prescriptionNotes = ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    customerName = String(formData.get('customerName') ?? '')
    customerEmail = String(formData.get('customerEmail') ?? '')
    phone = String(formData.get('phone') ?? '')
    address = String(formData.get('address') ?? '')
    city = String(formData.get('city') ?? '')
    postalCode = String(formData.get('postalCode') ?? '')
    deliveryLatitude = Number(formData.get('deliveryLatitude') ?? '') || null
    deliveryLongitude = Number(formData.get('deliveryLongitude') ?? '') || null
    paymentMethod = String(formData.get('paymentMethod') ?? 'cash-on-delivery')
    prescriptionNotes = String(formData.get('prescriptionNotes') ?? '')
    const rawFile = formData.get('prescriptionFile') as File | null
    prescriptionFile = rawFile && rawFile.size > 0 ? rawFile : null

    try {
      items = JSON.parse(String(formData.get('items') ?? '[]')) as typeof items
    } catch {
      return jsonResponse('Invalid cart payload.')
    }
  } else {
    const body = await request.json()
    customerName = String(body.customerName ?? '')
    customerEmail = String(body.customerEmail ?? '')
    phone = String(body.phone ?? '')
    address = String(body.address ?? '')
    city = String(body.city ?? '')
    postalCode = String(body.postalCode ?? '')
    deliveryLatitude = typeof body.deliveryLatitude === 'number' ? body.deliveryLatitude : null
    deliveryLongitude = typeof body.deliveryLongitude === 'number' ? body.deliveryLongitude : null
    paymentMethod = String(body.paymentMethod ?? 'cash-on-delivery')
    items = Array.isArray(body.items) ? body.items : []
  }

  if (!customerName || !customerEmail || !phone || !address || !city || !postalCode) {
    return jsonResponse('Missing customer information.')
  }

  if (!items.length) {
    return jsonResponse('Cart is empty.')
  }

  const routeKeys = [...new Set(items.map((item) => item.routeKey).filter(Boolean))]
  const products = await prisma.product.findMany({
    where: {
      OR: [{ routeKey: { in: routeKeys } }],
      active: true,
    },
    include: { pharmacy: true },
  })

  if (!products.length) {
    return jsonResponse('No pharmacies are available for the selected products.', 404)
  }

  const requiresPrescription = items.some((item) => item.requiresPrescription)
  if (requiresPrescription && !prescriptionFile) {
    return jsonResponse('A prescription file is required for this cart.')
  }

  const order = await prisma.$transaction(async (tx) => {
    const selectedItems = items.map((item) => {
      const candidates = products.filter((product) => product.routeKey === item.routeKey)
      const currentProduct = products.find((product) => product.id === item.id)
      const eligible = candidates.filter((candidate) => candidate.stock >= item.quantity)

      if (!eligible.length) {
        throw new Error(`No pharmacy has enough stock for ${item.name}.`)
      }

      if (deliveryLatitude != null && deliveryLongitude != null) {
        eligible.sort((a, b) => {
          const aDistance =
            a.pharmacy.latitude != null && a.pharmacy.longitude != null
              ? haversineKm(
                  deliveryLatitude,
                  deliveryLongitude,
                  a.pharmacy.latitude,
                  a.pharmacy.longitude,
                )
              : Number.POSITIVE_INFINITY
          const bDistance =
            b.pharmacy.latitude != null && b.pharmacy.longitude != null
              ? haversineKm(
                  deliveryLatitude,
                  deliveryLongitude,
                  b.pharmacy.latitude,
                  b.pharmacy.longitude,
                )
              : Number.POSITIVE_INFINITY
          return aDistance - bDistance
        })
      } else if (currentProduct && eligible.some((candidate) => candidate.id === currentProduct.id)) {
        eligible.sort((a, b) => (a.id === currentProduct.id ? -1 : b.id === currentProduct.id ? 1 : 0))
      } else {
        eligible.sort((a, b) => b.pharmacy.rating - a.pharmacy.rating || b.stock - a.stock)
      }

      return { item, product: eligible[0] }
    })

    const subtotal = selectedItems.reduce((sum, entry) => {
      return sum + Number(entry.product.discountPrice ?? entry.product.price ?? 0) * entry.item.quantity
    }, 0)
    const shipping = subtotal > 150 ? 0 : 15
    const total = subtotal + shipping
    const orderNumber = `MD-${Date.now().toString().slice(-8)}`

    const createdOrder = await tx.customerOrder.create({
      data: {
        orderNumber,
        customerName,
        customerEmail,
        phone,
        address,
        city,
        deliveryLatitude,
        deliveryLongitude,
        postalCode,
        paymentMethod,
        subtotal: toAmount(subtotal),
        shipping: toAmount(shipping),
        total: toAmount(total),
        status: 'PENDING',
      },
    })

    const grouped = new Map<string, typeof selectedItems>()
    for (const selected of selectedItems) {
      const current = grouped.get(selected.product.pharmacyId) ?? []
      grouped.set(selected.product.pharmacyId, [...current, selected])
    }

    for (const [pharmacyId, groupedItems] of grouped.entries()) {
      const pharmacy = groupedItems[0]?.product.pharmacy
      if (!pharmacy) {
        throw new Error('Pharmacy not found for order routing.')
      }

      const pharmacySubtotal = groupedItems.reduce((sum, item) => {
        return sum + Number(item.product.discountPrice ?? item.product.price ?? 0) * item.item.quantity
      }, 0)

      const commissionAmount = pharmacySubtotal * pharmacy.commissionRate
      const distanceKm =
        deliveryLatitude != null &&
        deliveryLongitude != null &&
        pharmacy.latitude != null &&
        pharmacy.longitude != null
          ? haversineKm(deliveryLatitude, deliveryLongitude, pharmacy.latitude, pharmacy.longitude)
          : null

      const pharmacyOrder = await tx.pharmacyOrder.create({
        data: {
          customerOrderId: createdOrder.id,
          pharmacyId,
          status: 'PENDING',
          subtotal: toAmount(pharmacySubtotal),
          shipping: 0,
          total: toAmount(pharmacySubtotal),
          commissionAmount: toAmount(commissionAmount),
          estimatedSlaMins: distanceKm != null ? estimateSlaMinutes(distanceKm) : 30,
        },
      })

      for (const item of groupedItems) {
        const unitPrice = Number(item.product.discountPrice ?? item.product.price ?? 0)

        await tx.orderItem.create({
          data: {
            pharmacyOrderId: pharmacyOrder.id,
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.item.quantity,
            unitPrice,
            lineTotal: toAmount(unitPrice * item.item.quantity),
          },
        })

        await tx.product.update({
          where: { id: item.product.id },
          data: { stock: { decrement: item.item.quantity } },
        })
      }

      const needsRxForThisPharmacy = groupedItems.some((item) => item.item.requiresPrescription)
      if (needsRxForThisPharmacy && prescriptionFile) {
        const buffer = Buffer.from(await prescriptionFile.arrayBuffer())
        await tx.prescription.create({
          data: {
            customerOrderId: createdOrder.id,
            pharmacyOrderId: pharmacyOrder.id,
            status: 'PENDING',
            fileName: prescriptionFile.name,
            mimeType: prescriptionFile.type || 'application/octet-stream',
            fileData: buffer.toString('base64'),
            customerName,
            customerEmail,
            customerPhone: phone,
            notes: prescriptionNotes || null,
          },
        })
      }
    }

    return createdOrder
  })

  return NextResponse.json({
    orderNumber: order.orderNumber,
    message: 'Order placed successfully.',
  })
}
