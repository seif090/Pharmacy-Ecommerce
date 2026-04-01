import { NextResponse } from 'next/server'
import { createSession, hashPassword } from '@/lib/auth'
import { getPrisma } from '@/lib/db'

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function POST(request: Request) {
  const prisma = getPrisma()
  const body = (await request.json()) as {
    pharmacyName?: string
    licenseNumber?: string
    address?: string
    city?: string
    latitude?: number | null
    longitude?: number | null
    managerName?: string
    managerEmail?: string
    password?: string
    commissionRate?: number
  }

  if (
    !body.pharmacyName ||
    !body.licenseNumber ||
    !body.address ||
    !body.city ||
    !body.managerName ||
    !body.managerEmail ||
    !body.password
  ) {
    return NextResponse.json({ message: 'Missing required onboarding fields.' }, { status: 400 })
  }

  const pharmacy = await prisma.pharmacy.create({
    data: {
      name: body.pharmacyName,
      slug: `${slugify(body.pharmacyName)}-${Date.now().toString().slice(-4)}`,
      licenseNumber: body.licenseNumber,
      address: body.address,
      city: body.city,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      commissionRate: body.commissionRate ?? 0.08,
      rating: 0,
      status: 'PENDING',
    },
  })

  const user = await prisma.pharmacyUser.create({
    data: {
      pharmacyId: pharmacy.id,
      name: body.managerName,
      email: body.managerEmail.toLowerCase(),
      passwordHash: hashPassword(body.password),
      role: 'PHARMACY',
      active: true,
    },
  })

  await createSession(user.id)

  return NextResponse.json({
    pharmacy,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      pharmacyId: user.pharmacyId,
    },
  })
}
