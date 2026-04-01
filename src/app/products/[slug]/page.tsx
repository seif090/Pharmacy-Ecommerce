import { ShieldAlert, Package, Pill } from 'lucide-react'
import { notFound } from 'next/navigation'
import { AddToCartButton } from '@/components/add-to-cart-button'
import { getProductBySlug } from '@/lib/catalog'
import { formatCurrency } from '@/lib/utils'

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const price = Number(product.discountPrice ?? product.price)

  return (
    <section className="hero-grid">
      <div className="hero-panel">
        <div className="product-topline">
          <span className="badge">{product.pharmacy?.name ?? 'Marketplace'}</span>
          <span className="badge">{product.category?.name ?? 'General'}</span>
          {product.requiresPrescription ? (
            <span className="badge badge-warn">
              <ShieldAlert size={14} />
              Prescription required
            </span>
          ) : null}
        </div>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <div className="metrics section">
          <span className="badge">
            <Package size={14} />
            Stock: {product.stock}
          </span>
          {product.form ? (
            <span className="badge">
              <Pill size={14} />
              {product.form}
            </span>
          ) : null}
          {product.dosage ? <span className="badge">{product.dosage}</span> : null}
        </div>
        <div className="section-heading" style={{ marginTop: 24 }}>
          <div>
            <strong style={{ fontSize: '2rem' }}>{formatCurrency(price)}</strong>
            {product.discountPrice ? (
              <div className="muted">
                Regular: <span className="strike">{formatCurrency(Number(product.price))}</span>
              </div>
            ) : null}
          </div>
        <AddToCartButton
          product={{
            id: product.id,
            name: product.name,
            price,
            routeKey: product.routeKey,
            pharmacyId: product.pharmacy?.id ?? '',
            pharmacyName: product.pharmacy?.name ?? 'Marketplace',
            requiresPrescription: product.requiresPrescription,
          }}
          />
        </div>
      </div>
    </section>
  )
}
