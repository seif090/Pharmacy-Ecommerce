import Link from 'next/link'
import { getRecentOrders } from '@/lib/catalog'
import { requireUser } from '@/lib/auth'
import { PharmacyOrderBoard } from '@/components/pharmacy-order-board'

export default async function AdminOrdersPage() {
  await requireUser(['ADMIN'])
  const orders = await getRecentOrders()

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

      <PharmacyOrderBoard
        orders={orders.flatMap((order) =>
          order.pharmacyOrders.map((pharmacyOrder) => ({
            id: pharmacyOrder.id,
            status: pharmacyOrder.status,
            subtotal: pharmacyOrder.subtotal,
            total: pharmacyOrder.total,
            estimatedSlaMins: pharmacyOrder.estimatedSlaMins,
            notes: pharmacyOrder.notes,
            pharmacy: { name: pharmacyOrder.pharmacy.name },
            customerOrder: {
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              city: order.city,
            },
            items: pharmacyOrder.items,
            prescription: pharmacyOrder.prescription,
          })),
        )}
      />
    </section>
  )
}
