import { NextResponse } from 'next/server'
import { ensureApiUser } from '@/lib/auth'
import { getPrisma } from '@/lib/db'

async function fileToBase64(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer())
  return buffer.toString('base64')
}

export async function GET() {
  const user = await ensureApiUser(['ADMIN', 'PHARMACY'])
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const prisma = getPrisma()
  const prescriptions = await prisma.prescription.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customerOrder: true,
      pharmacyOrder: { include: { pharmacy: true } },
      reviewer: true,
    },
  })

  const filtered =
    user.role === 'ADMIN'
      ? prescriptions
      : prescriptions.filter((item) => item.pharmacyOrder?.pharmacyId === user.pharmacyId)

  return NextResponse.json({ prescriptions: filtered })
}

export async function POST(request: Request) {
  const prisma = getPrisma()
  const formData = await request.formData()
  const orderNumber = String(formData.get('orderNumber') ?? '')
  const customerName = String(formData.get('customerName') ?? '')
  const customerEmail = String(formData.get('customerEmail') ?? '')
  const customerPhone = String(formData.get('customerPhone') ?? '')
  const notes = String(formData.get('notes') ?? '')
  const rawFile = formData.get('file') as File | null
  const file = rawFile && rawFile.size > 0 ? rawFile : null

  if (!orderNumber || !customerName || !customerEmail || !customerPhone || !file) {
    return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 })
  }

  const order = await prisma.customerOrder.findUnique({
    where: { orderNumber },
    include: { pharmacyOrders: true },
  })

  if (!order) {
    return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
  }

  const fileData = await fileToBase64(file)

  await Promise.all(
    order.pharmacyOrders.map((pharmacyOrder) =>
      prisma.prescription.create({
        data: {
          customerOrderId: order.id,
          pharmacyOrderId: pharmacyOrder.id,
          status: 'PENDING',
          fileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileData,
          customerName,
          customerEmail,
          customerPhone,
          notes: notes || null,
        },
      }),
    ),
  )

  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  const user = await ensureApiUser(['ADMIN', 'PHARMACY'])
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const prisma = getPrisma()
  const body = (await request.json()) as {
    id?: string
    status?: 'APPROVED' | 'REJECTED'
    notes?: string
  }

  if (!body.id || !body.status) {
    return NextResponse.json({ message: 'Missing id or status.' }, { status: 400 })
  }

  const prescription = await prisma.prescription.findUnique({
    where: { id: body.id },
    include: { pharmacyOrder: true },
  })

  if (!prescription) {
    return NextResponse.json({ message: 'Prescription not found.' }, { status: 404 })
  }

  if (user.role === 'PHARMACY' && prescription.pharmacyOrder?.pharmacyId !== user.pharmacyId) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.prescription.update({
    where: { id: body.id },
    data: {
      status: body.status,
      notes: body.notes ?? prescription.notes,
      reviewerId: user.id,
      reviewedAt: new Date(),
    },
  })

  return NextResponse.json({ prescription: updated })
}
