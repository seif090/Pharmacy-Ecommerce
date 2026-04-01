'use client'

import { useState } from 'react'

type PrescriptionItem = {
  id: string
  status: string
  fileName: string
  mimeType: string
  fileData: string
  customerName: string
  customerEmail: string
  customerPhone: string
  notes?: string | null
  pharmacyOrder?: { pharmacy: { name: string } | null } | null
  customerOrder: { orderNumber: string }
  reviewer?: { name: string } | null
}

export function PrescriptionReviewList({
  prescriptions,
}: {
  prescriptions: PrescriptionItem[]
}) {
  const [items, setItems] = useState(prescriptions)

  async function updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const response = await fetch('/api/prescriptions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })

    if (!response.ok) {
      return
    }

    const result = (await response.json()) as { prescription?: PrescriptionItem }
    if (result.prescription) {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...result.prescription } : item)),
      )
    }
  }

  if (!items.length) {
    return <div className="empty-state compact">No prescriptions pending review.</div>
  }

  return (
    <div className="stack">
      {items.map((item) => (
        <article className="card" key={item.id}>
          <div className="section-heading">
            <div>
              <span className="badge">
                {item.pharmacyOrder?.pharmacy?.name ?? 'Marketplace'} · {item.status}
              </span>
              <h3>{item.customerOrder.orderNumber}</h3>
            </div>
            <a
              className="button button-secondary"
              href={`data:${item.mimeType};base64,${item.fileData}`}
              download={item.fileName}
            >
              Download file
            </a>
          </div>
          <p className="muted">
            {item.customerName} · {item.customerEmail} · {item.customerPhone}
          </p>
          {item.notes ? <p>{item.notes}</p> : null}
          <div className="hero-actions">
            <button type="button" className="button" onClick={() => updateStatus(item.id, 'APPROVED')}>
              Approve
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => updateStatus(item.id, 'REJECTED')}
            >
              Reject
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}
