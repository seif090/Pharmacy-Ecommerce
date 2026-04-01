import { NextResponse } from 'next/server'
import { ensureApiUser } from '@/lib/auth'
import { getPrisma } from '@/lib/db'

async function recalculateCustomerOrderStatus(prisma: ReturnType<typeof getPrisma>, orderId: string) {
  const pharmacyOrders = await prisma.pharmacyOrder.findMany({
    where: { customerOrderId: orderId },
    select: { status: true },
  })

  if (!pharmacyOrders.length) {
    return
  }

  const statuses = pharmacyOrders.map((item) => item.status)
  let customerStatus: 'PENDING' | 'PARTIALLY_CONFIRMED' | 'CONFIRMED' | 'READY' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' = 'PENDING'

  if (statuses.every((status) => status === 'CANCELLED')) {
    customerStatus = 'CANCELLED'
  } else if (statuses.every((status) => status === 'DELIVERED')) {
    customerStatus = 'DELIVERED'
  } else if (statuses.some((status) => status === 'OUT_FOR_DELIVERY')) {
    customerStatus = 'SHIPPED'
  } else if (statuses.some((status) => status === 'PREPARING')) {
    customerStatus = 'PROCESSING'
  } else if (statuses.some((status) => status === 'CONFIRMED')) {
    customerStatus = 'CONFIRMED'
  } else if (statuses.some((status) => status === 'CANCELLED')) {
    customerStatus = 'PARTIALLY_CONFIRMED'
  }

  await prisma.customerOrder.update({
    where: { id: orderId },
    data: { status: customerStatus },
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await ensureApiUser(['ADMIN', 'PHARMACY'])
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const prisma = getPrisma()
  const body = (await request.json()) as {
    status?: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
    notes?: string
  }

  if (!body.status) {
    return NextResponse.json({ message: 'Status is required.' }, { status: 400 })
  }

  const pharmacyOrder = await prisma.pharmacyOrder.findUnique({
    where: { id },
    include: { pharmacy: true },
  })

  if (!pharmacyOrder) {
    return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
  }

  if (user.role === 'PHARMACY' && pharmacyOrder.pharmacyId !== user.pharmacyId) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.pharmacyOrder.update({
    where: { id },
    data: {
      status: body.status,
      notes: body.notes ?? pharmacyOrder.notes,
    },
    include: {
      pharmacy: true,
      customerOrder: true,
      items: { include: { product: true } },
      prescription: true,
    },
  })

  await recalculateCustomerOrderStatus(prisma, updated.customerOrderId)

  return NextResponse.json({ pharmacyOrder: updated })
}
