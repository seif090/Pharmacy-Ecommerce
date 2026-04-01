'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

export type FilterChipItem = {
  value: string
  label: ReactNode
  href?: string
  disabled?: boolean
}

type FilterChipsProps = {
  items: FilterChipItem[]
  selectedValue: string
  mode: 'link' | 'button'
  onSelect?: (value: string) => void
  className?: string
}

export function FilterChips({
  items,
  selectedValue,
  mode,
  onSelect,
  className = 'hero-actions',
}: FilterChipsProps) {
  return (
    <div className={className} style={{ flexWrap: 'wrap' }}>
      {items.map((item) => {
        const active = item.value === selectedValue
        const chipClass = active ? 'button' : 'button button-secondary'

        if (mode === 'link') {
          if (item.disabled) {
            return (
              <span key={item.value} className={chipClass} aria-disabled="true">
                {item.label}
              </span>
            )
          }

          return (
            <Link
              key={item.value}
              href={(item.href ?? '/') as never}
              className={chipClass}
              aria-pressed={active}
            >
              {item.label}
            </Link>
          )
        }

        return (
          <button
            key={item.value}
            type="button"
            className={chipClass}
            aria-pressed={active}
            disabled={item.disabled}
            onClick={() => onSelect?.(item.value)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
