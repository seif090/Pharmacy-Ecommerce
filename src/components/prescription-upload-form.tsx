'use client'

import type { FormEvent } from 'react'
import { useState } from 'react'

export function PrescriptionUploadForm() {
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/prescriptions', {
        method: 'POST',
        body: formData,
      })

      const result = (await response.json()) as { message?: string }
      if (!response.ok) {
        throw new Error(result.message ?? 'Upload failed.')
      }

      setMessage('Prescription uploaded successfully.')
      event.currentTarget.reset()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not upload the file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <div className="section-heading">
        <h3>Upload prescription</h3>
        <p className="muted">Attach a file to an existing order number.</p>
      </div>
      {message ? <div className="alert">{message}</div> : null}
      <div className="form-grid-2">
        <label>
          Order number
          <input name="orderNumber" required placeholder="MD-12345678" />
        </label>
        <label>
          Customer email
          <input name="customerEmail" type="email" required />
        </label>
      </div>
      <div className="form-grid-2">
        <label>
          Customer name
          <input name="customerName" required />
        </label>
        <label>
          Customer phone
          <input name="customerPhone" required />
        </label>
      </div>
      <label>
        File
        <input name="file" type="file" accept="image/*,.pdf" required />
      </label>
      <label>
        Notes
        <textarea name="notes" rows={4} />
      </label>
      <button className="button" type="submit" disabled={loading}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>
    </form>
  )
}
