'use client'

import { useState } from 'react'

type ApprovalPharmacy = {
  id: string
  name: string
  slug: string
  licenseNumber: string
  address: string
  city: string
  status: string
  rating: number
  commissionRate: number
  _count: { products: number; pharmacyOrders: number }
  users: Array<{ name: string; email: string }>
}

export function PharmacyApprovalList({
  pharmacies,
}: {
  pharmacies: ApprovalPharmacy[]
}) {
  const [items, setItems] = useState(pharmacies)

  async function updateStatus(id: string, status: 'ACTIVE' | 'PENDING' | 'SUSPENDED') {
    const response = await fetch(`/api/pharmacies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      return
    }

    const result = (await response.json()) as { pharmacy?: ApprovalPharmacy }
    if (result.pharmacy) {
      setItems((current) =>
        current.map((pharmacy) => (pharmacy.id === id ? { ...pharmacy, ...result.pharmacy } : pharmacy)),
      )
    }
  }

  if (!items.length) {
    return <div className="empty-state compact">No pharmacy approvals pending.</div>
  }

  return (
    <div className="grid-products">
      {items.map((pharmacy) => (
        <article className="card" key={pharmacy.id}>
          <span className="badge">{pharmacy.status}</span>
          <h3>{pharmacy.name}</h3>
          <p className="muted">
            {pharmacy.address}
            <br />
            {pharmacy.city}
          </p>
          <p className="muted">License: {pharmacy.licenseNumber}</p>
          <p className="muted">
            {pharmacy._count.products} products - {pharmacy._count.pharmacyOrders} orders
          </p>
          <div className="hero-actions">
            <button type="button" className="button" onClick={() => updateStatus(pharmacy.id, 'ACTIVE')}>
              Approve
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => updateStatus(pharmacy.id, 'SUSPENDED')}
            >
              Suspend
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
