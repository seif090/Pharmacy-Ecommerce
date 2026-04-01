import { formatCurrency } from '@/lib/utils'

export function OrdersTable({
  orders,
}: {
  orders: Array<{
    id: string
    orderNumber: string
    customerName: string
    status: string
    total: unknown
    paymentMethod: string
    createdAt: Date
    pharmacyOrders: Array<{
      id: string
      status: string
      pharmacy: { name: string }
      items: Array<{ productName: string; quantity: number }>
      prescription?: { status: string } | null
    }>
  }>
}) {
  if (!orders.length) {
    return <div className="empty-state compact">No orders yet.</div>
  }

  return (
    <div className="card">
      <div className="section-heading">
        <h3>Recent orders</h3>
        <p className="muted">Marketplace orders split by pharmacy fulfillment.</p>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Fulfillment</th>
              <th>Total</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <strong>{order.orderNumber}</strong>
                  <div className="muted">{order.paymentMethod}</div>
                </td>
                <td>
                  {order.customerName}
                  <div className="muted">{order.status}</div>
                </td>
                <td>
                  <div className="stack">
                    {order.pharmacyOrders.map((pharmacyOrder) => (
                      <span key={pharmacyOrder.id} className="badge">
                        {pharmacyOrder.pharmacy.name} · {pharmacyOrder.status}
                        {pharmacyOrder.prescription ? ` · Rx ${pharmacyOrder.prescription.status}` : ''}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{formatCurrency(Number(order.total))}</td>
                <td>
                  {order.pharmacyOrders
                    .flatMap((pharmacyOrder) => pharmacyOrder.items)
                    .map((item) => `${item.productName} x${item.quantity}`)
                    .join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
