import Link from 'next/link'
import { getPharmacyDashboard } from '@/lib/catalog'
import { requireUser } from '@/lib/auth'
import { PharmacyOrderBoard } from '@/components/pharmacy-order-board'

export default async function PharmacyOrdersPage() {
  const user = await requireUser(['PHARMACY'])
  if (!user.pharmacyId) {
    return (
      <section className="section">
        <div className="empty-state">
          <h1>No pharmacy assigned</h1>
        </div>
      </section>
    )
  }

  const dashboard = await getPharmacyDashboard(user.pharmacyId)

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Orders</span>
          <h1>My pharmacy orders</h1>
          <p className="muted">Process and update status for orders assigned to your pharmacy.</p>
        </div>
        <Link href="/pharmacy" className="button button-secondary">
          Back to pharmacy dashboard
        </Link>
      </div>

      <PharmacyOrderBoard orders={dashboard.orders} />
    </section>
  )
}
