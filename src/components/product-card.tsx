import Link from 'next/link'
import { ArrowRight, ShieldAlert } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { AddToCartButton } from '@/components/add-to-cart-button'

export function ProductCard({
  product,
}: {
  product: {
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
    pharmacy: { id: string; name: string; city?: string | null }
    category?: { name: string } | null
  }
}) {
  const price = product.discountPrice ?? product.price

  return (
    <article className="card product-card">
      <div className="product-topline">
        <span className="badge">{product.pharmacy.name}</span>
        <span className="badge">{product.category?.name ?? 'General'}</span>
        {product.requiresPrescription ? (
          <span className="badge badge-warn">
            <ShieldAlert size={14} />
            Rx
          </span>
        ) : null}
      </div>
      <h3>{product.name}</h3>
      <p className="muted">{product.description}</p>
      <div className="price-row">
        <div>
          <strong>{formatCurrency(price as number)}</strong>
          {product.discountPrice ? (
            <span className="strike">{formatCurrency(product.price as number)}</span>
          ) : null}
        </div>
        <span className="muted">{product.stock} in stock</span>
      </div>
      <div className="actions-row">
        <Link href={`/products/${product.slug}`} className="button button-secondary">
          Details
          <ArrowRight size={16} />
        </Link>
        <AddToCartButton
          product={{
            id: product.id,
            name: product.name,
            price: Number(price),
            routeKey: product.routeKey,
            pharmacyId: product.pharmacy.id,
            pharmacyName: product.pharmacy.name,
            requiresPrescription: product.requiresPrescription,
          }}
        />
      </div>
    </article>
  )
}
