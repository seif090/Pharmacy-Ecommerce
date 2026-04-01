'use client'

import type { FormEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FilterChips } from '@/components/filter-chips'
import { PaginationBar } from '@/components/pagination-bar'
import { buildPaginationItems, buildPaginationSummary } from '@/lib/pagination'

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

function normalizeStatus(value: string | null) {
  const candidate = value?.toUpperCase() ?? 'ALL'
  return statuses.includes(candidate as (typeof statuses)[number]) ? candidate : 'ALL'
}

export function PrescriptionTracker() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()

  const orderNumberQuery = searchParams.get('orderNumber')?.trim() ?? ''
  const customerEmailQuery = searchParams.get('customerEmail')?.trim() ?? ''
  const statusFilter = normalizeStatus(searchParams.get('status'))
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  const [orderNumber, setOrderNumber] = useState(orderNumberQuery)
  const [customerEmail, setCustomerEmail] = useState(customerEmailQuery)
  const [items, setItems] = useState<TrackerPrescription[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setOrderNumber(orderNumberQuery)
    setCustomerEmail(customerEmailQuery)
  }, [customerEmailQuery, orderNumberQuery])

  const updateQuery = useCallback((params: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(queryString)

    for (const [key, value] of Object.entries(params)) {
      if (!value) {
        nextParams.delete(key)
      } else {
        nextParams.set(key, value)
      }
    }

    const query = nextParams.toString()
    router.replace((query ? `${pathname}?${query}` : pathname) as never)
  }, [pathname, queryString, router])

  useEffect(() => {
    if (!orderNumberQuery || !customerEmailQuery) {
      setItems([])
      setPagination(null)
      setError(null)
      return
    }

    let cancelled = false

    async function loadPrescriptions() {
      setLoading(true)
      setError(null)

      try {
        const url = new URL('/api/prescriptions/lookup', window.location.origin)
        url.searchParams.set('orderNumber', orderNumberQuery)
        url.searchParams.set('customerEmail', customerEmailQuery)
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

        if (cancelled) {
          return
        }

        setItems(result.prescriptions ?? [])
        setPagination(result.pagination ?? null)

        if (result.pagination && result.pagination.page !== page) {
          updateQuery({ page: String(result.pagination.page) })
        }
      } catch (lookupError) {
        if (cancelled) {
          return
        }

        setError(lookupError instanceof Error ? lookupError.message : 'Could not search prescriptions.')
        setItems([])
        setPagination(null)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPrescriptions()

    return () => {
      cancelled = true
    }
  }, [customerEmailQuery, orderNumberQuery, page, queryString, updateQuery])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const nextOrderNumber = String(formData.get('orderNumber') ?? '').trim()
    const nextCustomerEmail = String(formData.get('customerEmail') ?? '').trim()

    updateQuery({
      orderNumber: nextOrderNumber,
      customerEmail: nextCustomerEmail,
      page: '1',
      status: 'ALL',
    })
  }

  const filteredItems = statusFilter === 'ALL' ? items : items.filter((item) => item.status === statusFilter)

  const chipItems = statuses.map((status) => ({
    value: status,
    label: status === 'ALL' ? 'All statuses' : status,
    href: status === 'ALL' ? `${pathname}` : buildStatusHref(status),
  }))

  const paginationItems = pagination
    ? buildPaginationItems(pagination.page, pagination.totalPages, (nextPage) => buildPageHref(nextPage))
    : []

  function buildStatusHref(status: (typeof statuses)[number]) {
    const nextParams = new URLSearchParams(queryString)
    if (status === 'ALL') {
      nextParams.delete('status')
    } else {
      nextParams.set('status', status)
    }
    nextParams.set('page', '1')
    const query = nextParams.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  function buildPageHref(nextPage: number) {
    const nextParams = new URLSearchParams(queryString)
    nextParams.set('page', String(nextPage))
    const query = nextParams.toString()
    return query ? `${pathname}?${query}` : pathname
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
            <input
              name="orderNumber"
              required
              placeholder="MD-12345678"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
            />
          </label>
          <label>
            Customer email
            <input
              name="customerEmail"
              type="email"
              required
              placeholder="ahmed@example.com"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
            />
          </label>
        </div>
        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Searching...' : 'Search prescriptions'}
        </button>
      </form>

      {orderNumberQuery && customerEmailQuery ? (
        <div className="stack">
          <div className="card">
            <div className="section-heading">
              <div>
                <h4>Quick filters</h4>
                <p className="muted">Switch prescription status chips instantly.</p>
              </div>
            </div>
            <FilterChips
              items={chipItems}
              selectedValue={statusFilter}
              mode="link"
              resetHref={buildStatusHref('ALL')}
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

          {pagination ? (
            <PaginationBar
              items={paginationItems}
              selectedValue={String(page)}
              summary={buildPaginationSummary(pagination.page, pagination.totalPages, pagination.total)}
              title="Pages"
              description="Browse matched prescriptions page by page."
            />
          ) : null}
        </div>
      ) : (
        <div className="empty-state compact">Search to see prescription status and documents.</div>
      )}
    </div>
  )
}
