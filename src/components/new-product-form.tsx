'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'

export function NewProductForm({
  categories,
  pharmacies,
  pharmacyId,
}: {
  categories: Array<{ slug: string; name: string }>
  pharmacies: Array<{ id: string; name: string }>
  pharmacyId?: string
}) {
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)

    const payload = {
      name: String(formData.get('name') ?? ''),
      scientificName: String(formData.get('scientificName') ?? '') || undefined,
      manufacturer: String(formData.get('manufacturer') ?? '') || undefined,
      description: String(formData.get('description') ?? ''),
      dosage: String(formData.get('dosage') ?? '') || undefined,
      form: String(formData.get('form') ?? '') || undefined,
      stock: Number(formData.get('stock') ?? 0),
      price: Number(formData.get('price') ?? 0),
      discountPrice: String(formData.get('discountPrice') ?? '')
        ? Number(formData.get('discountPrice'))
        : undefined,
      categorySlug: String(formData.get('categorySlug') ?? ''),
      imageUrl: String(formData.get('imageUrl') ?? '') || undefined,
      requiresPrescription: formData.get('requiresPrescription') === 'on',
      featured: formData.get('featured') === 'on',
      lowStockThreshold: Number(formData.get('lowStockThreshold') ?? 10),
      tags: String(formData.get('tags') ?? '') || undefined,
      pharmacyId: pharmacyId ?? String(formData.get('pharmacyId') ?? ''),
      active: formData.get('active') === 'on',
    }

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as { message?: string }
      if (!response.ok) {
        throw new Error(result.message ?? 'Unable to create product')
      }

      setMessage('Product created successfully.')
      event.currentTarget.reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <div className="section-heading">
        <h3>Add product</h3>
        <p className="muted">Create a pharmacy-specific product listing.</p>
      </div>
      {message ? <div className="alert">{message}</div> : null}
      <div className="form-grid-2">
        <label>
          Product name
          <input name="name" required />
        </label>
        <label>
          Scientific name
          <input name="scientificName" />
        </label>
      </div>
      <div className="form-grid-2">
        <label>
          Manufacturer
          <input name="manufacturer" />
        </label>
        <label>
          Category
          <select name="categorySlug" defaultValue={categories[0]?.slug ?? ''} required>
            {categories.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!pharmacyId ? (
        <label>
          Pharmacy
          <select name="pharmacyId" defaultValue={pharmacies[0]?.id ?? ''} required>
            {pharmacies.map((pharmacy) => (
              <option key={pharmacy.id} value={pharmacy.id}>
                {pharmacy.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        Description
        <textarea name="description" required rows={4} />
      </label>
      <div className="form-grid-2">
        <label>
          Dosage
          <input name="dosage" />
        </label>
        <label>
          Form
          <input name="form" />
        </label>
      </div>
      <div className="form-grid-3">
        <label>
          Price
          <input name="price" type="number" step="0.01" required />
        </label>
        <label>
          Discount price
          <input name="discountPrice" type="number" step="0.01" />
        </label>
        <label>
          Stock
          <input name="stock" type="number" min="0" required />
        </label>
      </div>
      <div className="form-grid-2">
        <label>
          Low stock threshold
          <input name="lowStockThreshold" type="number" min="0" defaultValue={10} />
        </label>
        <label>
          Image URL
          <input name="imageUrl" />
        </label>
      </div>
      <label>
        Tags
        <input name="tags" placeholder="pain,fever,headache" />
      </label>
      <div className="checkbox-row">
        <label>
          <input name="requiresPrescription" type="checkbox" /> Requires prescription
        </label>
        <label>
          <input name="featured" type="checkbox" /> Featured
        </label>
        <label>
          <input name="active" type="checkbox" defaultChecked /> Active
        </label>
      </div>
      <button className="button" type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Create product'}
      </button>
    </form>
  )
}
