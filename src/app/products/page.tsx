import { ProductsBrowser } from '@/components/products-browser'
import { getCategories, getPharmacies, getProducts } from '@/lib/catalog'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>
}) {
  const params = await searchParams
  const [products, categories, pharmacies] = await Promise.all([
    getProducts({ search: params.search, category: params.category }),
    getCategories(),
    getPharmacies(),
  ])

  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Catalog</span>
          <h1>Browse pharmacy products</h1>
          <p className="muted">Search by medicine name, category, or use-case.</p>
        </div>
      </div>
      <ProductsBrowser products={products} categories={categories} pharmacies={pharmacies} />
    </section>
  )
}
