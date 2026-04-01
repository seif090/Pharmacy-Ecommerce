import Link from 'next/link'
import { getPharmacies } from '@/lib/catalog'

export default async function PharmaciesPage() {
  const pharmacies = await getPharmacies()

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Marketplace</span>
          <h1>Partner pharmacies</h1>
          <p className="muted">Browse the vendors powering the pharmacy marketplace.</p>
        </div>
        <Link href="/products" className="button button-secondary">
          Browse products
        </Link>
      </div>

      <div className="grid-products">
        {pharmacies.map((pharmacy) => (
          <article className="card" key={pharmacy.id}>
            <span className="badge">{pharmacy.status}</span>
            <h3>{pharmacy.name}</h3>
            <p className="muted">
              {pharmacy.address}
              <br />
              {pharmacy.city}
            </p>
            <div className="metrics">
              <span className="badge">{pharmacy._count.products} products</span>
              <span className="badge">{pharmacy._count.pharmacyOrders} orders</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
