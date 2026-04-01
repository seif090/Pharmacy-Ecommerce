'use client'

import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { formatCurrency } from '@/lib/utils'

export function CartClient() {
  const { items, updateQuantity, removeItem, total, clearCart } = useCart()

  if (!items.length) {
    return (
      <div className="empty-state">
        <h2>Your cart is empty</h2>
        <p className="muted">Add products from the catalog to start a checkout.</p>
        <Link href="/products" className="button">
          Browse products
        </Link>
      </div>
    )
  }

  return (
    <div className="two-col">
      <section className="card">
        <div className="section-heading">
          <h2>Cart items</h2>
          <button type="button" className="button button-ghost" onClick={clearCart}>
            Clear cart
          </button>
        </div>
        <div className="stack">
          {items.map((item) => (
            <article className="cart-row" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <p className="muted">
                  {item.pharmacyName} · {formatCurrency(item.price)} each
                  {item.requiresPrescription ? ' · Rx' : ''}
                </p>
              </div>
              <div className="qty-controls">
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus size={14} />
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus size={14} />
                </button>
                <button
                  type="button"
                  className="icon-button icon-button-danger"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <aside className="card">
        <h2>Order summary</h2>
        <div className="summary-list">
          <div>
            <span>Subtotal</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
          <div>
            <span>Shipping</span>
            <strong>{formatCurrency(total > 150 ? 0 : 15)}</strong>
          </div>
          <div>
            <span>Total</span>
            <strong>{formatCurrency(total > 150 ? total : total + 15)}</strong>
          </div>
        </div>
        <Link href="/checkout" className="button button-block">
          Go to checkout
        </Link>
      </aside>
    </div>
  )
}
