import Link from 'next/link'
import { ChartColumnBig, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { getCategories, getDashboardStats, getFeaturedProducts } from '@/lib/catalog'
import { formatCurrency } from '@/lib/utils'
import { ProductCard } from '@/components/product-card'

export default async function HomePage() {
  const [featured, categories, stats] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getDashboardStats(),
  ])

  return (
    <div className="hero-grid">
      <section className="hero">
        <div className="hero-panel">
          <span className="badge">Full-stack pharmacy ecommerce</span>
          <h1>Sell medicines, devices, and care essentials with one clean flow.</h1>
          <p>
            Medora is a Next.js pharmacy system with product discovery, cart management,
            checkout, inventory tracking, and an admin dashboard.
          </p>
          <div className="hero-actions">
            <Link href="/products" className="button">
              Browse products
            </Link>
            <Link href="/admin" className="button button-secondary">
              Open admin
            </Link>
          </div>
          <div className="metrics section">
            <span className="badge">
              <Sparkles size={14} />
              {stats.products} products
            </span>
            <span className="badge">
              <ShieldCheck size={14} />
              {categories.length} categories
            </span>
            <span className="badge">
              <ChartColumnBig size={14} />
              {formatCurrency(stats.revenue)} revenue
            </span>
          </div>
        </div>
        <div className="hero-grid">
          <div className="hero-spot">
            <Truck size={18} />
            <h3>Delivery-ready checkout</h3>
            <p className="muted">
              Capture customer details, payment method, address, and order items in a single flow.
            </p>
          </div>
          <div className="hero-spot">
            <ShieldCheck size={18} />
            <h3>Inventory-aware backend</h3>
            <p className="muted">
              Orders validate stock before creation and update inventory atomically in the database.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Shop by category</h2>
            <p className="muted">Fast navigation for common pharmacy browsing paths.</p>
          </div>
          <Link href="/products" className="button button-secondary">
            View all
          </Link>
        </div>
        <div className="grid-products">
          {categories.map((category) => (
            <article className="card" key={category.id}>
              <span className="badge">{category._count.products} items</span>
              <h3>{category.name}</h3>
              <p className="muted">Curated medicines and health products in this category.</p>
              <Link href={`/products?category=${category.slug}`} className="button button-secondary">
                Explore
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <h2>Featured products</h2>
            <p className="muted">Seeded from the database and ready for cart checkout.</p>
          </div>
        </div>
        <div className="grid-products">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  )
}
