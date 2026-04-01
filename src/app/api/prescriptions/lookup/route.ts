import { NextResponse } from 'next/server'
import { getPrisma } from '@/lib/db'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const orderNumber = url.searchParams.get('orderNumber')?.trim() ?? ''
  const customerEmail = url.searchParams.get('customerEmail')?.trim().toLowerCase() ?? ''
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
  const pageSize = Math.max(1, Math.min(Number(url.searchParams.get('pageSize') ?? '5') || 5, 20))

  if (!orderNumber || !customerEmail) {
    return NextResponse.json({ message: 'Order number and email are required.' }, { status: 400 })
  }

  const prisma = getPrisma()
  const where = {
    customerEmail,
    customerOrder: {
      orderNumber,
    },
  }

  const total = await prisma.prescription.count({ where })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  const prescriptions = await prisma.prescription.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (safePage - 1) * pageSize,
    take: pageSize,
    include: {
      customerOrder: true,
      pharmacyOrder: { include: { pharmacy: true } },
      reviewer: true,
    },
  })

  return NextResponse.json({
    prescriptions,
    pagination: {
      page: safePage,
      pageSize,
      total,
      totalPages,
    },
  })
}
