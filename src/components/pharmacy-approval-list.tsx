'use client'

import { useState } from 'react'
import { FilterChips, type FilterChipItem } from '@/components/filter-chips'

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

export type { ApprovalPharmacy }

type PaginationItem = {
  value: string
  label: string
  href: string
}

export function PharmacyApprovalList({
  pharmacies,
  selectedStatus,
  statusItems,
  pagination,
  pageItems,
}: {
  pharmacies: ApprovalPharmacy[]
  selectedStatus: string
  statusItems: FilterChipItem[]
  pagination: {
    page: number
    totalPages: number
    total: number
  }
  pageItems: PaginationItem[]
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
        current
          .map((pharmacy) => (pharmacy.id === id ? { ...pharmacy, ...result.pharmacy } : pharmacy))
          .filter((pharmacy) => selectedStatus === 'all' || pharmacy.status === selectedStatus),
      )
    }
  }

  if (!items.length) {
    return <div className="empty-state compact">No pharmacies match the selected filters.</div>
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="section-heading">
          <div>
            <h4>Quick filters</h4>
            <p className="muted">Switch approval status chips instantly.</p>
          </div>
          <span className="badge">
            Page {pagination.page} of {pagination.totalPages} - {pagination.total} records
          </span>
        </div>
        <FilterChips items={statusItems} selectedValue={selectedStatus} mode="link" />
      </div>
      {pageItems.length > 1 ? (
        <div className="card">
          <div className="section-heading">
            <div>
              <h4>Pages</h4>
              <p className="muted">Browse pharmacy approvals page by page.</p>
            </div>
          </div>
          <FilterChips items={pageItems} selectedValue={String(pagination.page)} mode="link" />
        </div>
      ) : null}
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
    </div>
  )
}
