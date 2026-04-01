import { NextResponse } from 'next/server'
import { ensureApiUser } from '@/lib/auth'
import { getPrisma } from '@/lib/db'

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
  const body = (await request.json()) as Partial<{
    stock: number
    featured: boolean
    requiresPrescription: boolean
    active: boolean
    lowStockThreshold: number
  }>

  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
  }

  if (user.role === 'PHARMACY' && existing.pharmacyId !== user.pharmacyId) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(typeof body.stock === 'number' ? { stock: body.stock } : {}),
      ...(typeof body.featured === 'boolean' ? { featured: body.featured } : {}),
      ...(typeof body.requiresPrescription === 'boolean'
        ? { requiresPrescription: body.requiresPrescription }
        : {}),
      ...(typeof body.active === 'boolean' ? { active: body.active } : {}),
      ...(typeof body.lowStockThreshold === 'number'
        ? { lowStockThreshold: body.lowStockThreshold }
        : {}),
    },
  })

  return NextResponse.json({ product })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await ensureApiUser(['ADMIN', 'PHARMACY'])
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const prisma = getPrisma()
  const existing = await prisma.product.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ message: 'Product not found.' }, { status: 404 })
  }

  if (user.role === 'PHARMACY' && existing.pharmacyId !== user.pharmacyId) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
