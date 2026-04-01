import 'server-only'

import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPrisma } from '@/lib/db'

export const SESSION_COOKIE = 'medora_session'
const SESSION_DAYS = 7

export type AuthUser = {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'PHARMACY'
  pharmacyId: string | null
  pharmacyName: string | null
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derived = crypto.scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${derived}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(':')
  if (!salt || !key) {
    return false
  }

  const derived = crypto.scryptSync(password, salt, 64)
  const keyBuffer = Buffer.from(key, 'hex')
  return keyBuffer.length === derived.length && crypto.timingSafeEqual(keyBuffer, derived)
}

export async function createSession(userId: string) {
  const prisma = getPrisma()
  const token = crypto.randomUUID()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })
}

export async function destroySession() {
  const prisma = getPrisma()
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashToken(token) },
    })
  }

  cookieStore.delete(SESSION_COOKIE)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) {
    return null
  }

  const prisma = getPrisma()
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { pharmacy: true } } },
  })

  if (!session || session.expiresAt.getTime() < Date.now() || !session.user.active) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined)
    }
    return null
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
    pharmacyId: session.user.pharmacyId,
    pharmacyName: session.user.pharmacy?.name ?? null,
  }
}

export async function requireUser(allowedRoles?: Array<'ADMIN' | 'PHARMACY'>) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect('/login')
  }

  return user
}

export async function ensureApiUser(allowedRoles?: Array<'ADMIN' | 'PHARMACY'>) {
  const user = await getCurrentUser()
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null
  }

  return user
}
