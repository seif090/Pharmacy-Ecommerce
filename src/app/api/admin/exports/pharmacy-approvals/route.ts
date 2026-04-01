import { NextResponse } from 'next/server'
import { ensureApiUser } from '@/lib/auth'
import { getPrisma } from '@/lib/db'
import { toCsv } from '@/lib/csv'

export async function GET() {
  const user = await ensureApiUser(['ADMIN'])
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const prisma = getPrisma()
  const pharmacies = await prisma.pharmacy.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      _count: { select: { products: true, pharmacyOrders: true } },
      users: { select: { name: true, email: true } },
    },
  })

  const csv = toCsv(
    [
      'createdAt',
      'name',
      'city',
      'licenseNumber',
      'status',
      'products',
      'orders',
      'commissionRate',
      'rating',
      'managers',
    ],
    pharmacies.map((pharmacy) => [
      pharmacy.createdAt.toISOString(),
      pharmacy.name,
      pharmacy.city,
      pharmacy.licenseNumber,
      pharmacy.status,
      pharmacy._count.products,
      pharmacy._count.pharmacyOrders,
      pharmacy.commissionRate,
      pharmacy.rating,
      pharmacy.users.map((user) => `${user.name} <${user.email}>`).join(' | '),
    ]),
  )

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="pharmacy-approvals.csv"',
    },
  })
}
