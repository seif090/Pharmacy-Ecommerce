import { NextResponse } from 'next/server'
import { createSession, verifyPassword } from '@/lib/auth'
import { getPrisma } from '@/lib/db'

export async function POST(request: Request) {
  const prisma = getPrisma()
  const body = (await request.json()) as { email?: string; password?: string }

  if (!body.email || !body.password) {
    return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 })
  }

  const user = await prisma.pharmacyUser.findUnique({
    where: { email: body.email.toLowerCase() },
  })

  if (!user || !user.active || !verifyPassword(body.password, user.passwordHash)) {
    return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 })
  }

  await createSession(user.id)

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      pharmacyId: user.pharmacyId,
    },
  })
}
