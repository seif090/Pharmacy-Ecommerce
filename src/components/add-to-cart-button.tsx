'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useCart } from '@/components/cart-provider'

export function AddToCartButton({
  product,
}: {
  product: {
    id: string
    name: string
    price: number
    routeKey: string
    pharmacyId: string
    pharmacyName: string
    requiresPrescription: boolean
  }
}) {
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  return (
    <button
      type="button"
      className="button"
      onClick={() => {
        addItem(product)
        setAdded(true)
        window.setTimeout(() => setAdded(false), 1200)
      }}
    >
      <Plus size={16} />
      {added ? 'Added' : 'Add to cart'}
    </button>
  )
}
