import { PharmacyOnboardingForm } from '@/components/pharmacy-onboarding-form'

export default function PharmacyOnboardingPage() {
  return (
    <section className="section">
      <div className="section-heading">
        <div>
          <span className="badge">Onboarding</span>
          <h1>Register a new pharmacy</h1>
          <p className="muted">
            Create the pharmacy, manager account, and public marketplace presence in one flow.
          </p>
        </div>
      </div>

      <div className="hero-grid">
        <div className="hero-spot">
          <h3>What happens next</h3>
          <p className="muted">
            The pharmacy gets created with pending status, the manager account is logged in, and the
            dashboard becomes available immediately.
          </p>
        </div>
        <PharmacyOnboardingForm />
      </div>
    </section>
  )
}
