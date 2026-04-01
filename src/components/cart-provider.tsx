'use client'

import type { ReactNode } from 'react'
import { createContext, useContext, useMemo, useSyncExternalStore } from 'react'

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  routeKey: string
  pharmacyId: string
  pharmacyName: string
  requiresPrescription: boolean
}

type CartContextValue = {
  items: CartItem[]
  addItem: (item: {
    id: string
    name: string
    price: number
    routeKey: string
    pharmacyId: string
    pharmacyName: string
    requiresPrescription: boolean
  }) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  total: number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'medora-cart'
const CART_EVENT = 'medora-cart-change'

function readCartItems() {
  if (typeof window === 'undefined') {
    return []
  }

  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as Partial<CartItem>[]
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter(
        (item): item is CartItem =>
          typeof item.id === 'string' &&
          typeof item.name === 'string' &&
          typeof item.price === 'number' &&
          typeof item.quantity === 'number' &&
          typeof item.routeKey === 'string' &&
          typeof item.pharmacyId === 'string' &&
          typeof item.pharmacyName === 'string' &&
          typeof item.requiresPrescription === 'boolean',
      )
      .map((item) => ({
        ...item,
      }))
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

function writeCartItems(items: CartItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(CART_EVENT))
}

function subscribe(callback: () => void) {
  window.addEventListener(CART_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CART_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribe, readCartItems, () => [])

  const value = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue['addItem'] = (item) => {
      const current = readCartItems()
      const existing = current.find((entry) => entry.id === item.id)
      const next = existing
        ? current.map((entry) =>
            entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
          )
        : [...current, { ...item, quantity: 1 }]
      writeCartItems(next)
    }

    const updateQuantity: CartContextValue['updateQuantity'] = (id, quantity) => {
      const current = readCartItems()
      const next = current
        .map((entry) => (entry.id === id ? { ...entry, quantity } : entry))
        .filter((entry) => entry.quantity > 0)
      writeCartItems(next)
    }

    const removeItem: CartContextValue['removeItem'] = (id) => {
      const next = readCartItems().filter((entry) => entry.id !== id)
      writeCartItems(next)
    }

    const clearCart = () => writeCartItems([])

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return { items, addItem, updateQuantity, removeItem, clearCart, total }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within CartProvider')
  }
  return context
}
