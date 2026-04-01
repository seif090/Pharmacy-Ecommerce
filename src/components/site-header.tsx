import Link from 'next/link'
import { LayoutDashboard, Pill, ShoppingBag, UserCircle2 } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { LogoutButton } from '@/components/logout-button'

export async function SiteHeader() {
  const user = await getCurrentUser()

  return (
    <header className="header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Pill size={18} />
          </span>
          <span>
            <strong>Medora</strong>
            <small>Pharmacy Commerce</small>
          </span>
        </Link>
        <nav className="nav">
          <Link href="/products">Products</Link>
          <Link href="/pharmacies">Pharmacies</Link>
          <Link href="/prescriptions">Prescriptions</Link>
          <Link href="/cart">
            <ShoppingBag size={16} />
            Cart
          </Link>
          {user?.role === 'ADMIN' ? (
            <Link href="/admin">
              <LayoutDashboard size={16} />
              Admin
            </Link>
          ) : null}
          {user?.role === 'ADMIN' ? <Link href="/admin/orders">Orders</Link> : null}
          {user?.role === 'PHARMACY' ? (
            <Link href="/pharmacy">
              <LayoutDashboard size={16} />
              Pharmacy
            </Link>
          ) : null}
          {user?.role === 'PHARMACY' ? <Link href="/pharmacy/orders">Orders</Link> : null}
          {user ? (
            <span className="badge">
              <UserCircle2 size={14} />
              {user.name} · {user.role}
            </span>
          ) : (
            <Link href="/login" className="button button-secondary">
              Sign in
            </Link>
          )}
          {user ? <LogoutButton /> : null}
        </nav>
      </div>
    </header>
  )
}
