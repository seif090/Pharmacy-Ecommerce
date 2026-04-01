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
  const notifications = await prisma.adminNotification.findMany({
    orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
    include: { pharmacy: true },
  })

  const csv = toCsv(
    ['createdAt', 'type', 'title', 'message', 'pharmacy', 'city', 'isRead', 'readAt'],
    notifications.map((notification) => [
      notification.createdAt.toISOString(),
      notification.type,
      notification.title,
      notification.message,
      notification.pharmacy?.name ?? '',
      notification.pharmacy?.city ?? '',
      Boolean(notification.readAt),
      notification.readAt ? notification.readAt.toISOString() : '',
    ]),
  )

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="admin-notifications.csv"',
    },
  })
}
