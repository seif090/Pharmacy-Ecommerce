import Link from 'next/link'
import { getRecentOrders } from '@/lib/catalog'
import { requireUser } from '@/lib/auth'
import { PharmacyOrderBoard } from '@/components/pharmacy-order-board'

function buildHref(strategy: string, pharmacyId: string) {
  const params = new URLSearchParams()
  if (strategy && strategy !== 'all') {
    params.set('strategy', strategy)
  }
  if (pharmacyId && pharmacyId !== 'all') {
    params.set('pharmacyId', pharmacyId)
  }
  const query = params.toString()
  return query ? `/admin/orders?${query}` : '/admin/orders'
}

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

  function chipClass(active: boolean) {
    return active ? 'button' : 'button button-secondary'
  }

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Orders</span>
          <h1>Manage pharmacy order status</h1>
          <p className="muted">Update every pharmacy order inside a split customer checkout.</p>
        </div>
        <div className="hero-actions">
          <Link href="/api/admin/exports/assignment-history" className="button button-secondary">
            Export assignment CSV
          </Link>
          <Link href="/admin" className="button button-secondary">
            Back to dashboard
          </Link>
        </div>
      </div>

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="section-heading">
            <div>
              <h3>Quick filters</h3>
              <p className="muted">Tap a chip to switch instantly.</p>
            </div>
            <Link href="/admin/orders" className="button button-secondary">
              Clear filters
            </Link>
          </div>
        <div className="stack">
          <div className="hero-actions" style={{ flexWrap: 'wrap' }}>
            <Link
              href={buildHref('', pharmacyFilter || 'all') as never}
              className={chipClass(!strategyFilter)}
              aria-pressed={!strategyFilter}
            >
              All strategies
            </Link>
            {availableStrategies.map((strategy) => (
              <Link
                key={strategy}
                href={buildHref(strategy, pharmacyFilter || 'all') as never}
                className={chipClass(strategyFilter === strategy)}
                aria-pressed={strategyFilter === strategy}
              >
                {strategy.replaceAll('-', ' ')}
              </Link>
            ))}
          </div>
          <div className="hero-actions" style={{ flexWrap: 'wrap' }}>
            <Link
              href={buildHref(strategyFilter || 'all', '') as never}
              className={chipClass(!pharmacyFilter)}
              aria-pressed={!pharmacyFilter}
            >
              All pharmacies
            </Link>
            {availablePharmacies.map((pharmacy) => (
              <Link
                key={pharmacy.id}
                href={buildHref(strategyFilter || 'all', pharmacy.id) as never}
                className={chipClass(pharmacyFilter === pharmacy.id)}
                aria-pressed={pharmacyFilter === pharmacy.id}
              >
                {pharmacy.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <PharmacyOrderBoard orders={boardOrders} />
    </section>
  )
}
