import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCustomerOrderById } from '@/lib/catalog'
import { requireUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { OrderTimeline } from '@/components/order-timeline'
import { AssignmentHistoryTimeline } from '@/components/assignment-history-timeline'

export default async function AdminOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireUser(['ADMIN'])
  const { id } = await params
  const order = await getCustomerOrderById(id)

  if (!order) {
    notFound()
  }

  const events = [
    { label: 'Order placed', description: 'Customer submitted checkout.', active: true },
    {
      label: 'Pharmacy assigned',
      description: 'Nearest pharmacies were selected per route key.',
      active: ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
    },
    {
      label: 'Preparing',
      description: 'One or more pharmacy orders are being prepared.',
      active: ['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
    },
    {
      label: 'Out for delivery',
      description: 'Courier picked up the order.',
      active: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
    },
    {
      label: 'Delivered',
      description: 'Customer received the order.',
      active: order.status === 'DELIVERED',
    },
  ]

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">{order.status}</span>
          <h1>{order.orderNumber}</h1>
          <p className="muted">
            {order.customerName} - {order.city}
          </p>
        </div>
        <Link href="/admin/orders" className="button button-secondary">
          Back to orders
        </Link>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="section-heading">
            <h3>Timeline</h3>
            <p className="muted">Track the customer order lifecycle.</p>
          </div>
          <OrderTimeline events={events} />
        </div>

        <div className="card">
          <h3>Summary</h3>
          <p className="muted">{order.address}</p>
          <p className="muted">{formatCurrency(Number(order.total))}</p>
          <div className="stack">
            {order.pharmacyOrders.map((pharmacyOrder) => (
              <article key={pharmacyOrder.id} className="empty-state compact">
                <span className="badge">
                  {pharmacyOrder.pharmacy.name} - {pharmacyOrder.status}
                </span>
                <p className="muted">
                  SLA {pharmacyOrder.estimatedSlaMins}m - {formatCurrency(Number(pharmacyOrder.total))}
                </p>
                <p className="muted">
                  {pharmacyOrder.items
                    .map((item) => `${item.product.name} x${item.quantity}`)
                    .join(', ')}
                </p>
                {pharmacyOrder.prescription ? (
                  <p className="muted">Prescription: {pharmacyOrder.prescription.status}</p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <div className="card">
          <div className="section-heading">
            <div>
              <span className="badge">Assignment history</span>
              <h3>How each item was routed</h3>
            </div>
            <p className="muted">{order.assignmentEvents.length} routing event(s)</p>
          </div>
          <AssignmentHistoryTimeline events={order.assignmentEvents} />
        </div>
      </div>
    </section>
  )
}
