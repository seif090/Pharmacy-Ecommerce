'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'

type ProductBrowserProps = {
  products: Array<{
    id: string
    name: string
    slug: string
    routeKey: string
    description: string
    price: unknown
    discountPrice: unknown | null
    stock: number
    featured: boolean
    requiresPrescription: boolean
    pharmacy: { id: string; name: string; city: string }
    category?: { name: string; slug: string } | null
  }>
  categories: Array<{ slug: string; name: string }>
  pharmacies: Array<{ id: string; name: string }>
}

export function ProductsBrowser({ products, categories, pharmacies }: ProductBrowserProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [pharmacy, setPharmacy] = useState('all')

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !search ||
        [product.name, product.description, product.category?.name ?? '']
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      const matchesCategory = category === 'all' || product.category?.slug === category
      const matchesPharmacy = pharmacy === 'all' || product.pharmacy.id === pharmacy
      return matchesSearch && matchesCategory && matchesPharmacy
    })
  }, [products, search, category, pharmacy])

  return (
    <div>
      <div className="filter-bar card">
        <label className="search-input">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search medicines, devices, vitamins..."
          />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
        <select value={pharmacy} onChange={(event) => setPharmacy(event.target.value)}>
          <option value="all">All pharmacies</option>
          {pharmacies.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid-products">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {!filtered.length ? (
        <div className="empty-state">
          <h3>No products found</h3>
          <p className="muted">Try a different search or category filter.</p>
          <Link href="/products" className="button button-secondary">
            Reset view
          </Link>
        </div>
      ) : null}
    </div>
  )
}
