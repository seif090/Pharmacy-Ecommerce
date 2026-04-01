import { NextResponse } from 'next/server'
import { ensureApiUser } from '@/lib/auth'
import { getPrisma } from '@/lib/db'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await ensureApiUser(['ADMIN'])
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const prisma = getPrisma()

  const notification = await prisma.adminNotification.findUnique({ where: { id } })
  if (!notification) {
    return NextResponse.json({ message: 'Notification not found.' }, { status: 404 })
  }

  const updated = await prisma.adminNotification.update({
    where: { id },
    data: { readAt: notification.readAt ?? new Date() },
    include: { pharmacy: true },
  })

  return NextResponse.json({ notification: updated })
}
