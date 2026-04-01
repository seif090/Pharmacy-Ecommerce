'use client'

import { useState } from 'react'

type AdminNotification = {
  id: string
  type: string
  title: string
  message: string
  readAt: string | Date | null
  createdAt: string | Date
  pharmacy?: { name: string; city: string } | null
}

function toDate(value: string | Date | null | undefined) {
  if (!value) {
    return null
  }

  return value instanceof Date ? value : new Date(value)
}

export function AdminNotificationList({
  notifications,
}: {
  notifications: AdminNotification[]
}) {
  const [items, setItems] = useState(notifications)
  const unreadCount = items.filter((notification) => !notification.readAt).length

  async function markAsRead(id: string) {
    const response = await fetch(`/api/admin/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return
    }

    const result = (await response.json()) as { notification?: AdminNotification }
    const updatedNotification = result.notification
    if (updatedNotification) {
      setItems((current) =>
        current.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                ...updatedNotification,
                readAt: toDate(updatedNotification.readAt),
                createdAt: toDate(updatedNotification.createdAt) ?? new Date(),
              }
            : notification,
        ),
      )
    }
  }

  async function markAllAsRead() {
    const response = await fetch('/api/admin/notifications/mark-all-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return
    }

    setItems((current) =>
      current.map((notification) => ({
        ...notification,
        readAt: notification.readAt ?? new Date(),
      })),
    )
  }

  if (!items.length) {
    return <div className="empty-state compact">No notifications yet.</div>
  }

  return (
    <div className="stack">
      <div className="hero-actions">
        <span className="badge">{unreadCount} unread</span>
        <button type="button" className="button button-secondary" onClick={markAllAsRead} disabled={!unreadCount}>
          Mark all as read
        </button>
      </div>
      {items.map((notification) => (
        <article className="card" key={notification.id}>
              <div className="section-heading">
                <div>
                  <span className="badge">{notification.type.replaceAll('_', ' ')}</span>
                  <h3>{notification.title}</h3>
                </div>
                <span className="badge">{notification.readAt ? 'Read' : 'Unread'}</span>
              </div>
              <p className="muted">{notification.message}</p>
          {notification.pharmacy ? (
            <p className="muted">
              <strong>{notification.pharmacy.name}</strong>
              <br />
              {notification.pharmacy.city}
            </p>
          ) : null}
          <p className="muted">
            Created {toDate(notification.createdAt)?.toLocaleString() ?? 'Unknown'}
          </p>
          {!notification.readAt ? (
            <button type="button" className="button button-secondary" onClick={() => markAsRead(notification.id)}>
              Mark as read
            </button>
          ) : null}
        </article>
      ))}
    </div>
  )
}
