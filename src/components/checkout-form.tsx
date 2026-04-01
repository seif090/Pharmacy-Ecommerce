'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/cart-provider'

export function CheckoutForm() {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationStatus, setLocationStatus] = useState<string | null>(null)
  const needsPrescription = items.some((item) => item.requiresPrescription)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    formData.set('items', JSON.stringify(items))

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        body: formData,
      })

      const result = (await response.json()) as { message?: string; orderNumber?: string }
      if (!response.ok) {
        throw new Error(result.message ?? 'Could not place order.')
      }

      clearCart()
      router.push(`/checkout/success?order=${encodeURIComponent(result.orderNumber ?? '')}`)
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="form-grid card" onSubmit={handleSubmit}>
      <div className="section-heading">
        <h2>Delivery information</h2>
        <p className="muted">{items.length} item(s) ready for checkout</p>
      </div>
      {error ? <div className="alert">{error}</div> : null}
      <div className="form-grid-2">
        <label>
          Full name
          <input name="customerName" required minLength={2} placeholder="Ahmed Hassan" />
        </label>
        <label>
          Email
          <input name="customerEmail" type="email" required placeholder="ahmed@example.com" />
        </label>
      </div>
      <div className="form-grid-2">
        <label>
          Phone
          <input name="phone" required placeholder="+20 10 1234 5678" />
        </label>
        <label>
          Payment method
          <select name="paymentMethod" defaultValue="cash-on-delivery">
            <option value="cash-on-delivery">Cash on delivery</option>
            <option value="card">Card</option>
          </select>
        </label>
      </div>
      <div className="form-grid-2">
        <label>
          Latitude
          <input name="deliveryLatitude" type="number" step="any" placeholder="31.2001" />
        </label>
        <label>
          Longitude
          <input name="deliveryLongitude" type="number" step="any" placeholder="29.9187" />
        </label>
      </div>
      <button
        type="button"
        className="button button-secondary"
        onClick={() => {
          if (!navigator.geolocation) {
            setLocationStatus('Geolocation is not available in this browser.')
            return
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords
              const latitudeInput = document.querySelector<HTMLInputElement>(
                'input[name="deliveryLatitude"]',
              )
              const longitudeInput = document.querySelector<HTMLInputElement>(
                'input[name="deliveryLongitude"]',
              )
              if (latitudeInput) latitudeInput.value = String(latitude)
              if (longitudeInput) longitudeInput.value = String(longitude)
              setLocationStatus(`Using current location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
            },
            () => {
              setLocationStatus('Unable to read location. You can enter it manually.')
            },
          )
        }}
      >
        Use my location
      </button>
      {locationStatus ? <p className="muted">{locationStatus}</p> : null}
      <label>
        Prescription file
        <input name="prescriptionFile" type="file" accept="image/*,.pdf" required={needsPrescription} />
      </label>
      <label>
        Address
        <input name="address" required placeholder="12 Ahmed Orabi St." />
      </label>
      <div className="form-grid-2">
        <label>
          City
          <input name="city" required placeholder="Cairo" />
        </label>
        <label>
          Postal code
          <input name="postalCode" required placeholder="11511" />
        </label>
      </div>
      <button type="submit" className="button button-block" disabled={loading || items.length === 0}>
        {loading ? 'Placing order...' : 'Place order'}
      </button>
      <p className="muted">
        Total before shipping: {total.toFixed(2)} USD. Orders above 150 USD get free shipping.
        {needsPrescription ? ' A prescription file is required for at least one item.' : ''}
      </p>
    </form>
  )
}
