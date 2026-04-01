'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'

type BoardOrder = {
  id: string
  status: string
  subtotal: unknown
  total: unknown
  estimatedSlaMins: number
  notes?: string | null
  pharmacy?: { name: string }
  customerOrder: { orderNumber: string; customerName: string; city: string }
  items: Array<{ productName?: string; quantity: number; product?: { name: string } }>
  prescription?: { status: string } | null
}

const statusOptions = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
] as const

export function PharmacyOrderBoard({
  orders,
}: {
  orders: BoardOrder[]
}) {
  const [items, setItems] = useState(orders)

  async function updateStatus(id: string, status: (typeof statusOptions)[number]) {
    const response = await fetch(`/api/pharmacy-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      return
    }

    const result = (await response.json()) as { pharmacyOrder?: BoardOrder }
    if (result.pharmacyOrder) {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...result.pharmacyOrder } : item)),
      )
    }
  }

  if (!items.length) {
    return <div className="empty-state compact">No pharmacy orders yet.</div>
  }

  return (
    <div className="stack">
      {items.map((order) => (
        <article className="card" key={order.id}>
          <div className="section-heading">
            <div>
              <span className="badge">{order.status}</span>
              <h3>{order.customerOrder.orderNumber}</h3>
              <p className="muted">
                {order.customerOrder.customerName} - {order.customerOrder.city}
              </p>
            </div>
            <span className="badge">
              SLA {order.estimatedSlaMins}m · {formatCurrency(Number(order.total))}
            </span>
          </div>
          <p className="muted">
            {order.items
              .map((item) => `${item.productName ?? item.product?.name ?? 'Item'} x${item.quantity}`)
              .join(', ')}
          </p>
          {order.prescription ? <span className="badge">Rx {order.prescription.status}</span> : null}
          {order.notes ? <p>{order.notes}</p> : null}
          <div className="hero-actions">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                className="button button-secondary"
                onClick={() => updateStatus(order.id, status)}
              >
                {status.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}
