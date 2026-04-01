import { NextResponse } from 'next/server'
import { ensureApiUser } from '@/lib/auth'
import { getPrisma } from '@/lib/db'
import { toCsv } from '@/lib/csv'

export async function GET() {
  const user = await ensureApiUser(['PHARMACY'])
  if (!user || !user.pharmacyId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const prisma = getPrisma()
  const orders = await prisma.pharmacyOrder.findMany({
    where: { pharmacyId: user.pharmacyId },
    orderBy: { createdAt: 'desc' },
    include: {
      customerOrder: true,
      items: { include: { product: true } },
      prescription: true,
      assignmentEvents: true,
      pharmacy: true,
    },
  })

  const csv = toCsv(
    [
      'createdAt',
      'orderNumber',
      'customerName',
      'city',
      'status',
      'subtotal',
      'total',
      'slaMinutes',
      'items',
      'prescriptionStatus',
      'strategies',
    ],
    orders.map((order) => [
      order.createdAt.toISOString(),
      order.customerOrder.orderNumber,
      order.customerOrder.customerName,
      order.customerOrder.city,
      order.status,
      order.subtotal.toString(),
      order.total.toString(),
      order.estimatedSlaMins,
      order.items.map((item) => `${item.productName} x${item.quantity}`).join(' | '),
      order.prescription?.status ?? '',
      Array.from(new Set(order.assignmentEvents.map((event) => event.strategy))).join(' | '),
    ]),
  )

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="pharmacy-orders.csv"',
    },
  })
}
