import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { getAdminNotifications } from '@/lib/catalog'
import { AdminNotificationList } from '@/components/admin-notification-list'

export default async function AdminNotificationsPage() {
  await requireUser(['ADMIN'])
  const notifications = await getAdminNotifications()

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Notifications</span>
          <h1>Admin notifications</h1>
          <p className="muted">Track pending pharmacy onboarding and marketplace alerts.</p>
        </div>
        <div className="hero-actions">
          <a href="/api/admin/exports/notifications" className="button button-secondary">
            Export notifications CSV
          </a>
          <Link href="/admin" className="button button-secondary">
            Back to dashboard
          </Link>
        </div>
      </div>

      {notifications.length ? (
        <AdminNotificationList notifications={notifications} />
      ) : (
        <div className="empty-state">
          <h2>No notifications yet</h2>
          <p className="muted">New pharmacy onboarding requests will appear here automatically.</p>
        </div>
      )}
    </section>
  )
}
