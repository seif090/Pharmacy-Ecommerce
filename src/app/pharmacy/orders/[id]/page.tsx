import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPharmacyOrderById } from '@/lib/catalog'
import { requireUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { OrderTimeline } from '@/components/order-timeline'
import { AssignmentHistoryTimeline } from '@/components/assignment-history-timeline'

export default async function PharmacyOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser(['PHARMACY'])
  const { id } = await params
  const order = await getPharmacyOrderById(id)

  if (!order || order.pharmacyId !== user.pharmacyId) {
    notFound()
  }

  const events = [
    { label: 'Received', description: 'Order landed in your pharmacy queue.', active: true },
    {
      label: 'Confirmed',
      description: 'Pharmacy confirmed availability.',
      active: ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
    },
    {
      label: 'Preparing',
      description: 'Items are being picked and packed.',
      active: ['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
    },
    {
      label: 'Out for delivery',
      description: 'Courier is on the way.',
      active: ['OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status),
    },
    {
      label: 'Delivered',
      description: 'Pharmacy suborder delivered successfully.',
      active: order.status === 'DELIVERED',
    },
  ]

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">{order.status}</span>
          <h1>{order.customerOrder.orderNumber}</h1>
          <p className="muted">
            {order.customerOrder.customerName} - {order.customerOrder.city}
          </p>
        </div>
        <Link href="/pharmacy/orders" className="button button-secondary">
          Back to queue
        </Link>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="section-heading">
            <h3>Timeline</h3>
            <p className="muted">Track the suborder from confirmation to delivery.</p>
          </div>
          <OrderTimeline events={events} />
        </div>

        <div className="card">
          <h3>Fulfillment details</h3>
          <p className="muted">{order.pharmacy.name}</p>
          <p className="muted">SLA {order.estimatedSlaMins} minutes</p>
          <p className="muted">{formatCurrency(Number(order.total))}</p>
          <div className="stack">
            {order.items.map((item) => (
              <article key={item.id} className="empty-state compact">
                <strong>{item.product.name}</strong>
                <p className="muted">
                  {item.quantity} x {formatCurrency(Number(item.unitPrice))}
                </p>
              </article>
            ))}
          </div>
          {order.prescription ? <p className="muted">Prescription: {order.prescription.status}</p> : null}
        </div>
      </div>

      <div className="section">
        <div className="card">
          <div className="section-heading">
            <div>
              <span className="badge">Assignment history</span>
              <h3>Routing context for this suborder</h3>
            </div>
            <p className="muted">{order.assignmentEvents.length} event(s)</p>
          </div>
          <AssignmentHistoryTimeline events={order.assignmentEvents} />
        </div>
      </div>
    </section>
  )
}
