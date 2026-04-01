import Link from 'next/link'
import { getRecentOrders } from '@/lib/catalog'
import { requireUser } from '@/lib/auth'
import { PharmacyOrderBoard } from '@/components/pharmacy-order-board'

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ strategy?: string; pharmacyId?: string }>
}) {
  await requireUser(['ADMIN'])
  const orders = await getRecentOrders()
  const resolvedSearchParams = await searchParams
  const strategyFilter =
    resolvedSearchParams.strategy && resolvedSearchParams.strategy !== 'all'
      ? resolvedSearchParams.strategy
      : ''
  const pharmacyFilter =
    resolvedSearchParams.pharmacyId && resolvedSearchParams.pharmacyId !== 'all'
      ? resolvedSearchParams.pharmacyId
      : ''

  const availablePharmacies = Array.from(
    new Map(
      orders.flatMap((order) =>
        order.pharmacyOrders.map((pharmacyOrder) => [
          pharmacyOrder.pharmacy.id,
          pharmacyOrder.pharmacy.name,
        ]),
      ),
    ).entries(),
  ).map(([id, name]) => ({ id, name }))

  const availableStrategies = Array.from(
    new Set(orders.flatMap((order) => order.assignmentEvents.map((event) => event.strategy))),
  )

  const boardOrders = orders
    .flatMap((order) =>
      order.pharmacyOrders.map((pharmacyOrder) => ({
        id: pharmacyOrder.id,
        status: pharmacyOrder.status,
        subtotal: pharmacyOrder.subtotal,
        total: pharmacyOrder.total,
        estimatedSlaMins: pharmacyOrder.estimatedSlaMins,
        notes: pharmacyOrder.notes,
        detailsHref: `/admin/orders/${order.id}`,
        customerOrder: {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          city: order.city,
        },
        items: pharmacyOrder.items,
        prescription: pharmacyOrder.prescription,
        pharmacyId: pharmacyOrder.pharmacy.id,
        strategies: order.assignmentEvents
          .filter((event) => event.pharmacyOrderId === pharmacyOrder.id)
          .map((event) => event.strategy),
      })),
    )
    .filter((order) => {
      const matchesPharmacy = !pharmacyFilter || order.pharmacyId === pharmacyFilter
      const matchesStrategy = !strategyFilter || order.strategies.includes(strategyFilter)
      return matchesPharmacy && matchesStrategy
    })

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Orders</span>
          <h1>Manage pharmacy order status</h1>
          <p className="muted">Update every pharmacy order inside a split customer checkout.</p>
        </div>
        <Link href="/admin" className="button button-secondary">
          Back to dashboard
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <form className="form-grid-2" method="get">
          <label>
            Strategy
            <select name="strategy" defaultValue={strategyFilter || 'all'}>
              <option value="all">All strategies</option>
              {availableStrategies.map((strategy) => (
                <option key={strategy} value={strategy}>
                  {strategy.replaceAll('-', ' ')}
                </option>
              ))}
            </select>
          </label>
          <label>
            Pharmacy
            <select name="pharmacyId" defaultValue={pharmacyFilter || 'all'}>
              <option value="all">All pharmacies</option>
              {availablePharmacies.map((pharmacy) => (
                <option key={pharmacy.id} value={pharmacy.id}>
                  {pharmacy.name}
                </option>
              ))}
            </select>
          </label>
          <div className="hero-actions">
            <button type="submit" className="button">
              Apply filters
            </button>
            <Link href="/admin/orders" className="button button-secondary">
              Reset
            </Link>
          </div>
        </form>
      </div>

      <PharmacyOrderBoard orders={boardOrders} />
    </section>
  )
}
