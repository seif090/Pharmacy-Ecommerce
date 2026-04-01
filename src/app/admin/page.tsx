import Link from 'next/link'
import { getAdminNotifications, getCategories, getDashboardStats, getPharmacies, getPendingPharmacies, getProducts, getRecentOrders, getRecentPrescriptions, getUnreadAdminNotificationCount } from '@/lib/catalog'
import { formatCurrency } from '@/lib/utils'
import { NewProductForm } from '@/components/new-product-form'
import { OrdersTable } from '@/components/orders-table'
import { PrescriptionReviewList } from '@/components/prescription-review-list'
import { requireUser } from '@/lib/auth'
import { PharmacyApprovalList } from '@/components/pharmacy-approval-list'

export default async function AdminPage() {
  await requireUser(['ADMIN'])

  const [
    stats,
    products,
    orders,
    prescriptions,
    categories,
    pharmacies,
    pendingPharmacies,
    notifications,
    unreadNotifications,
  ] = await Promise.all([
    getDashboardStats(),
    getProducts(),
    getRecentOrders(),
    getRecentPrescriptions(),
    getCategories(),
    getPharmacies(),
    getPendingPharmacies(),
    getAdminNotifications(),
    getUnreadAdminNotificationCount(),
  ])

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Admin</span>
          <h1>Marketplace control center</h1>
          <p className="muted">
            Oversee pharmacies, products, split orders, and prescription reviews from one place.
          </p>
        </div>
        <Link href="/pharmacies" className="button button-secondary">
          Open public marketplace
        </Link>
      </div>

      <div className="section">
        <div className="section-heading">
          <div>
            <span className="badge">Notifications</span>
            <h3>Admin alerts</h3>
            <p className="muted">New onboarding requests and urgent marketplace events.</p>
          </div>
          <Link href="/admin/notifications" className="button button-secondary">
            Open notifications
            {unreadNotifications > 0 ? <span className="badge">{unreadNotifications}</span> : null}
          </Link>
        </div>
        <div className="stack">
          {notifications.slice(0, 3).map((notification) => (
            <article key={notification.id} className="card">
              <div className="section-heading">
                <div>
                  <span className="badge">{notification.type.replaceAll('_', ' ')}</span>
                  <h3>{notification.title}</h3>
                </div>
                <span className="badge">{notification.readAt ? 'Read' : 'Unread'}</span>
              </div>
              <p className="muted">{notification.message}</p>
              {notification.pharmacy ? <p className="muted">{notification.pharmacy.name}</p> : null}
            </article>
          ))}
        </div>
      </div>

      <div className="grid-products" style={{ marginBottom: 18 }}>
        <article className="card">
          <span className="badge">Products</span>
          <h2>{stats.products}</h2>
          <p className="muted">Active pharmacy listings</p>
        </article>
        <article className="card">
          <span className="badge">Pharmacies</span>
          <h2>{stats.pharmacies}</h2>
          <p className="muted">Registered vendors</p>
        </article>
        <article className="card">
          <span className="badge">Orders</span>
          <h2>{stats.orders}</h2>
          <p className="muted">Customer checkouts</p>
        </article>
        <article className="card">
          <span className="badge">Prescriptions</span>
          <h2>{stats.prescriptions}</h2>
          <p className="muted">Uploaded documents</p>
        </article>
      </div>

      <div className="two-col">
        <NewProductForm categories={categories} pharmacies={pharmacies} />
        <div className="card">
          <div className="section-heading">
            <h3>Pharmacy network</h3>
            <p className="muted">Registered vendors with location and activity data.</p>
          </div>
          <div className="stack">
            {pharmacies.map((pharmacy) => (
              <article key={pharmacy.id} className="cart-row">
                <div>
                  <strong>{pharmacy.name}</strong>
                  <p className="muted">
                    {pharmacy.city} - {pharmacy.status} - {pharmacy._count.products} products
                  </p>
                </div>
                <span className="badge">{pharmacy.rating.toFixed(1)} rating</span>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-heading">
          <div>
            <h3>Pending pharmacy approvals</h3>
            <p className="muted">Review new partner registrations before they go live.</p>
          </div>
        </div>
        <PharmacyApprovalList pharmacies={pendingPharmacies} />
      </div>

      <div className="section">
        <OrdersTable orders={orders} />
      </div>

      <div className="section">
        <div className="section-heading">
          <div>
            <h3>Prescription reviews</h3>
            <p className="muted">Approve or reject pharmacy uploads.</p>
          </div>
          <span className="badge">{formatCurrency(stats.revenue)} revenue</span>
        </div>
        <PrescriptionReviewList prescriptions={prescriptions} />
      </div>
    </section>
  )
}
