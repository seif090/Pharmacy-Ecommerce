import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  return (
    <section className="section login-shell">
      <div className="hero-panel">
        <span className="badge">Authentication</span>
        <h1>Sign in to the pharmacy marketplace</h1>
        <p className="muted">
          Use the seeded platform admin or pharmacy staff account to access dashboards and reviews.
        </p>
        <div className="stack">
          <div className="hero-spot">
            <strong>Admin</strong>
            <p className="muted">admin@medora.local / Admin@12345</p>
          </div>
          <div className="hero-spot">
            <strong>Pharmacy</strong>
            <p className="muted">alex@medora.local / Pharmacy@123</p>
          </div>
          <a href="/onboarding/pharmacy" className="button button-secondary">
            Register a pharmacy
          </a>
        </div>
      </div>
      <LoginForm />
    </section>
  )
}
