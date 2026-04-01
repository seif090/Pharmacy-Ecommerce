'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { FilterChips } from '@/components/filter-chips'

type TrackerPrescription = {
  id: string
  status: string
  fileName: string
  mimeType: string
  fileData: string
  customerName: string
  customerEmail: string
  customerPhone: string
  notes?: string | null
  createdAt: string | Date
  pharmacyOrder?: { pharmacy: { name: string } | null } | null
  customerOrder: { orderNumber: string }
  reviewer?: { name: string } | null
}

const statuses = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const
const PAGE_SIZE = 5

type Pagination = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function PrescriptionTracker() {
  const [items, setItems] = useState<TrackerPrescription[]>([])
  const [statusFilter, setStatusFilter] = useState<(typeof statuses)[number]>('ALL')
  const [search, setSearch] = useState<{ orderNumber: string; customerEmail: string } | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const activeSearch = search
    if (!activeSearch) {
      return
    }
    const { orderNumber, customerEmail } = activeSearch

    async function loadPrescriptions() {
      setLoading(true)
      setError(null)

      try {
        const url = new URL('/api/prescriptions/lookup', window.location.origin)
        url.searchParams.set('orderNumber', orderNumber)
        url.searchParams.set('customerEmail', customerEmail)
        url.searchParams.set('page', String(page))
        url.searchParams.set('pageSize', String(PAGE_SIZE))

        const response = await fetch(url.toString())
        const result = (await response.json()) as {
          prescriptions?: TrackerPrescription[]
          pagination?: Pagination
          message?: string
        }

        if (!response.ok) {
          throw new Error(result.message ?? 'Could not find prescriptions.')
        }

        setItems(result.prescriptions ?? [])
        setPagination(result.pagination ?? null)
        if (result.pagination && result.pagination.page !== page) {
          setPage(result.pagination.page)
        }
      } catch (lookupError) {
        setError(lookupError instanceof Error ? lookupError.message : 'Could not search prescriptions.')
        setItems([])
        setPagination(null)
      } finally {
        setLoading(false)
      }
    }

    loadPrescriptions()
  }, [page, search])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const orderNumber = String(formData.get('orderNumber') ?? '').trim()
    const customerEmail = String(formData.get('customerEmail') ?? '').trim()

    setStatusFilter('ALL')
    setSearch({ orderNumber, customerEmail })
    setPage(1)
  }

  const filteredItems = useMemo(
    () => (statusFilter === 'ALL' ? items : items.filter((item) => item.status === statusFilter)),
    [items, statusFilter],
  )
  const pageButtons = useMemo(() => {
    if (!pagination || pagination.totalPages <= 1) {
      return []
    }

    if (pagination.totalPages <= 5) {
      return Array.from({ length: pagination.totalPages }, (_, index) => index + 1)
    }

    const pages: Array<number | 'ellipsis-start' | 'ellipsis-end'> = [1]
    const start = Math.max(2, page - 1)
    const end = Math.min(pagination.totalPages - 1, page + 1)

    if (start > 2) {
      pages.push('ellipsis-start')
    }

    for (let current = start; current <= end; current += 1) {
      pages.push(current)
    }

    if (end < pagination.totalPages - 1) {
      pages.push('ellipsis-end')
    }

    pages.push(pagination.totalPages)
    return pages
  }, [page, pagination])

  const chipItems = statuses.map((status) => ({
    value: status,
    label: status === 'ALL' ? 'All statuses' : status,
  }))

  function goToPage(nextPage: number) {
    if (!pagination) {
      return
    }

    if (nextPage < 1 || nextPage > pagination.totalPages) {
      return
    }

    setPage(nextPage)
  }

  return (
    <div className="stack">
      <form className="card form-grid" onSubmit={handleSubmit}>
        <div className="section-heading">
          <div>
            <h3>Track prescription status</h3>
            <p className="muted">Search by order number and customer email.</p>
          </div>
        </div>
        {error ? <div className="alert">{error}</div> : null}
        <div className="form-grid-2">
          <label>
            Order number
            <input name="orderNumber" required placeholder="MD-12345678" />
          </label>
          <label>
            Customer email
            <input name="customerEmail" type="email" required placeholder="ahmed@example.com" />
          </label>
        </div>
        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Searching...' : 'Search prescriptions'}
        </button>
      </form>

      {search ? (
        <div className="stack">
          <div className="card">
            <div className="section-heading">
              <div>
                <h4>Quick filters</h4>
                <p className="muted">Switch prescription status chips instantly.</p>
              </div>
              <button type="button" className="button button-secondary" onClick={() => setStatusFilter('ALL')}>
                Clear filters
              </button>
            </div>
            <FilterChips
              items={chipItems}
              selectedValue={statusFilter}
              mode="button"
              onSelect={(value) => setStatusFilter(value as (typeof statuses)[number])}
            />
          </div>

          <div className="stack">
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <article className="card" key={item.id}>
                  <div className="section-heading">
                    <div>
                      <span className="badge">
                        {item.pharmacyOrder?.pharmacy?.name ?? 'Marketplace'} - {item.status}
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
                    {item.customerName} - {item.customerEmail} - {item.customerPhone}
                  </p>
                  {item.reviewer ? <p className="muted">Reviewed by {item.reviewer.name}</p> : null}
                  {item.notes ? <p>{item.notes}</p> : null}
                </article>
              ))
            ) : (
              <div className="empty-state compact">No prescriptions match the selected status.</div>
            )}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="card">
              <div className="section-heading">
                <div>
                  <h4>Pages</h4>
                  <p className="muted">
                    Page {pagination.page} of {pagination.totalPages} - {pagination.total} result
                    {pagination.total === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <div className="hero-actions" style={{ flexWrap: 'wrap' }}>
                <button type="button" className="button button-secondary" onClick={() => goToPage(page - 1)} disabled={page <= 1}>
                  Previous
                </button>
                {pageButtons.map((item) =>
                  typeof item === 'number' ? (
                    <button
                      key={item}
                      type="button"
                      className={page === item ? 'button' : 'button button-secondary'}
                      onClick={() => goToPage(item)}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={item} className="badge">
                      ...
                    </span>
                  ),
                )}
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="empty-state compact">Search to see prescription status and documents.</div>
      )}
    </div>
  )
}
