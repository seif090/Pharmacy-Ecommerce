import Link from 'next/link'
import { getCategories, getPharmacyDashboard, getPharmacies } from '@/lib/catalog'
import { formatCurrency } from '@/lib/utils'
import { NewProductForm } from '@/components/new-product-form'
import { PrescriptionReviewList } from '@/components/prescription-review-list'
import { requireUser } from '@/lib/auth'

export default async function PharmacyPage() {
  const user = await requireUser(['PHARMACY'])
  const pharmacyId = user.pharmacyId

  if (!pharmacyId) {
    return (
      <section className="section">
        <div className="empty-state">
          <h1>No pharmacy assigned</h1>
          <p className="muted">This account does not belong to a pharmacy yet.</p>
        </div>
      </section>
    )
  }

  const [dashboard, categories, pharmacies] = await Promise.all([
    getPharmacyDashboard(pharmacyId),
    getCategories(),
    getPharmacies(),
  ])

  const pharmacy = pharmacies.find((item) => item.id === pharmacyId)

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Pharmacy</span>
          <h1>{pharmacy?.name ?? user.pharmacyName}</h1>
          <p className="muted">Manage your own listings, fulfill orders, and review prescriptions.</p>
        </div>
        <Link href="/products" className="button button-secondary">
          Public catalog
        </Link>
        <Link href="/pharmacy/orders" className="button button-secondary">
          Orders
        </Link>
      </div>

      <div className="grid-products" style={{ marginBottom: 18 }}>
        <article className="card">
          <span className="badge">Orders</span>
          <h2>{dashboard.stats.orders}</h2>
          <p className="muted">Assigned pharmacy orders</p>
        </article>
        <article className="card">
          <span className="badge">Revenue</span>
          <h2>{formatCurrency(dashboard.stats.revenue)}</h2>
          <p className="muted">Suborder subtotal</p>
        </article>
        <article className="card">
          <span className="badge">Commission</span>
          <h2>{formatCurrency(dashboard.stats.commission)}</h2>
          <p className="muted">Estimated platform commission</p>
        </article>
        <article className="card">
          <span className="badge">Listings</span>
          <h2>{dashboard.products.length}</h2>
          <p className="muted">Active product listings</p>
        </article>
      </div>

      <div className="two-col">
        <NewProductForm categories={categories} pharmacies={pharmacies} pharmacyId={pharmacyId} />
        <div className="card">
          <div className="section-heading">
            <h3>My products</h3>
            <p className="muted">Only your pharmacy listings are editable here.</p>
          </div>
          <div className="stack">
            {dashboard.products.map((product) => (
              <article key={product.id} className="cart-row">
                <div>
                  <strong>{product.name}</strong>
                  <p className="muted">
                    {product.category?.name ?? 'General'} - Stock {product.stock}
                  </p>
                </div>
                <span className="badge">{formatCurrency(Number(product.discountPrice ?? product.price))}</span>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-heading">
          <div>
            <h3>Fulfillment queue</h3>
            <p className="muted">Track your assigned pharmacy orders.</p>
          </div>
        </div>
        <div className="stack">
          {dashboard.orders.map((order) => (
            <article className="card" key={order.id}>
              <div className="section-heading">
                <div>
                  <span className="badge">{order.status}</span>
                  <h3>{order.customerOrder.orderNumber}</h3>
                </div>
                <span className="badge">{formatCurrency(Number(order.total))}</span>
              </div>
              <p className="muted">
                {order.customerOrder.customerName} - {order.customerOrder.city}
              </p>
              <p className="muted">
                {order.items.map((item) => `${item.product.name} x${item.quantity}`).join(', ')}
              </p>
              {order.prescription ? <span className="badge">Rx {order.prescription.status}</span> : null}
            </article>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-heading">
          <div>
            <h3>Prescription reviews</h3>
            <p className="muted">Approve or reject documents assigned to your pharmacy.</p>
          </div>
        </div>
        <PrescriptionReviewList prescriptions={dashboard.prescriptions} />
      </div>
    </section>
  )
}
