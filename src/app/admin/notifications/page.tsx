import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getAdminNotificationsPage } from '@/lib/catalog'
import { AdminNotificationList } from '@/components/admin-notification-list'
import { PaginationBar } from '@/components/pagination-bar'
import { buildPaginationItems, buildPaginationSummary } from '@/lib/pagination'

function buildNotificationsHref(page: number) {
  const params = new URLSearchParams()
  if (page > 1) {
    params.set('notificationPage', String(page))
  }
  const query = params.toString()
  return query ? `/admin/notifications?${query}` : '/admin/notifications'
}

function buildNotificationsExportHref(scope: 'current' | 'all', page: number) {
  const params = new URLSearchParams()
  params.set('scope', scope)
  if (scope === 'current' && page > 1) {
    params.set('page', String(page))
  }
  const query = params.toString()
  return query ? `/api/admin/exports/notifications?${query}` : '/api/admin/exports/notifications'
}

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ notificationPage?: string }>
}) {
  await requireUser(['ADMIN'])
  const resolvedSearchParams = await searchParams
  const notificationPage = Math.max(1, Number(resolvedSearchParams.notificationPage ?? '1') || 1)
  const notificationsPage = await getAdminNotificationsPage({
    page: notificationPage,
    pageSize: 8,
  })
  const paginationItems = buildPaginationItems(
    notificationsPage.pagination.page,
    notificationsPage.pagination.totalPages,
    (page) => buildNotificationsHref(page),
  )

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Notifications</span>
          <h1>Admin notifications</h1>
          <p className="muted">Track pending pharmacy onboarding and marketplace alerts.</p>
        </div>
        <div className="hero-actions">
          <Link
            href={buildNotificationsExportHref('current', notificationsPage.pagination.page) as never}
            className="button button-secondary"
          >
            Export current page CSV
          </Link>
          <Link
            href={buildNotificationsExportHref('all', notificationsPage.pagination.page) as never}
            className="button button-secondary"
          >
            Export all CSV
          </Link>
          <Link href="/admin" className="button button-secondary">
            Back to dashboard
          </Link>
        </div>
      </div>

      {notificationsPage.items.length ? (
        <AdminNotificationList notifications={notificationsPage.items} />
      ) : (
        <div className="empty-state">
          <h2>No notifications yet</h2>
          <p className="muted">New pharmacy onboarding requests will appear here automatically.</p>
        </div>
      )}
      <PaginationBar
        items={paginationItems}
        selectedValue={String(notificationsPage.pagination.page)}
        summary={buildPaginationSummary(
          notificationsPage.pagination.page,
          notificationsPage.pagination.totalPages,
          notificationsPage.pagination.total,
        )}
        title="Pages"
        description="Browse admin notifications page by page."
      />
    </section>
  )
}
