import { NextResponse } from 'next/server'
import { ensureApiUser } from '@/lib/auth'
import { getPrisma } from '@/lib/db'
import { toCsv } from '@/lib/csv'

export async function GET(request: Request) {
  const user = await ensureApiUser(['ADMIN'])
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const scope = url.searchParams.get('scope') === 'current' ? 'current' : 'all'
  const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
  const pageSize = Math.max(1, Math.min(Number(url.searchParams.get('pageSize') ?? '8') || 8, 24))

  const prisma = getPrisma()
  const notifications = await prisma.adminNotification.findMany({
    orderBy: [{ readAt: 'asc' }, { createdAt: 'desc' }],
    ...(scope === 'current'
      ? {
          skip: (page - 1) * pageSize,
          take: pageSize,
        }
      : {}),
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
      'content-disposition': `attachment; filename="admin-notifications-${scope}.csv"`,
    },
  })
}
