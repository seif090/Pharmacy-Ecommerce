'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function PharmacyOnboardingForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const payload = {
      pharmacyName: String(formData.get('pharmacyName') ?? ''),
      licenseNumber: String(formData.get('licenseNumber') ?? ''),
      address: String(formData.get('address') ?? ''),
      city: String(formData.get('city') ?? ''),
      latitude: formData.get('latitude') ? Number(formData.get('latitude')) : null,
      longitude: formData.get('longitude') ? Number(formData.get('longitude')) : null,
      managerName: String(formData.get('managerName') ?? ''),
      managerEmail: String(formData.get('managerEmail') ?? ''),
      password: String(formData.get('password') ?? ''),
      commissionRate: formData.get('commissionRate') ? Number(formData.get('commissionRate')) : 0.08,
    }

    try {
      const response = await fetch('/api/pharmacies/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as { message?: string }
      if (!response.ok) {
        throw new Error(result.message ?? 'Onboarding failed.')
      }

      router.push('/pharmacy')
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not create pharmacy.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      {error ? <div className="alert">{error}</div> : null}
      <div className="form-grid-2">
        <label>
          Pharmacy name
          <input name="pharmacyName" required placeholder="Green Care Pharmacy" />
        </label>
        <label>
          License number
          <input name="licenseNumber" required placeholder="LIC-12345" />
        </label>
      </div>
      <div className="form-grid-2">
        <label>
          Address
          <input name="address" required placeholder="12 Corniche Rd" />
        </label>
        <label>
          City
          <input name="city" required placeholder="Alexandria" />
        </label>
      </div>
      <div className="form-grid-3">
        <label>
          Latitude
          <input name="latitude" type="number" step="any" placeholder="31.2001" />
        </label>
        <label>
          Longitude
          <input name="longitude" type="number" step="any" placeholder="29.9187" />
        </label>
        <label>
          Commission rate
          <input name="commissionRate" type="number" step="0.01" defaultValue={0.08} />
        </label>
      </div>
      <div className="form-grid-2">
        <label>
          Manager name
          <input name="managerName" required placeholder="Ahmed Salem" />
        </label>
        <label>
          Manager email
          <input name="managerEmail" type="email" required placeholder="manager@example.com" />
        </label>
      </div>
      <label>
        Password
        <input name="password" type="password" required placeholder="Strong password" />
      </label>
      <button type="submit" className="button button-block" disabled={loading}>
        {loading ? 'Creating...' : 'Create pharmacy'}
      </button>
    </form>
  )
}
