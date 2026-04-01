import { PrescriptionUploadForm } from '@/components/prescription-upload-form'

export default function PrescriptionsPage() {
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Prescriptions</span>
          <h1>Upload prescription files</h1>
          <p className="muted">
            Customers can attach documents to an existing order number for pharmacy review.
          </p>
        </div>
      </div>
      <PrescriptionUploadForm />
    </section>
  )
}
