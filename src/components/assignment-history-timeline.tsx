type AssignmentEvent = {
  id: string
  requestedItemName: string
  requestedRouteKey: string
  requestedPharmacyName?: string | null
  selectedProductName: string
  selectedRouteKey: string
  selectedPharmacyName: string
  strategy: string
  reason: string
  score: number
  distanceKm?: number | null
  createdAt?: Date
}

const strategyLabels: Record<string, string> = {
  'exact-route-match': 'Exact route match',
  'semantic-substitute': 'Semantic substitute',
  'route-key-substitute': 'Route key substitute',
  'nearest-fallback': 'Nearest fallback',
}

export function AssignmentHistoryTimeline({
  events,
}: {
  events: AssignmentEvent[]
}) {
  if (!events.length) {
    return <div className="empty-state compact">No assignment history recorded yet.</div>
  }

  return (
    <ol className="stack">
      {events.map((event, index) => (
        <li key={event.id} className="card">
          <div className="section-heading">
            <div>
              <span className="badge">
                {strategyLabels[event.strategy] ?? event.strategy.replaceAll('-', ' ')}
              </span>
              <h4>
                {index + 1}. {event.requestedItemName}
              </h4>
            </div>
            <span className="badge">
              Score {event.score.toFixed(0)}
              {event.distanceKm != null ? ` - ${event.distanceKm.toFixed(1)} km` : ''}
            </span>
          </div>
          <div className="stack">
            <div className="cart-row">
              <div>
                <strong>Requested</strong>
                <p className="muted">
                  {event.requestedRouteKey}
                  {event.requestedPharmacyName ? ` from ${event.requestedPharmacyName}` : ''}
                </p>
              </div>
              <span className="badge">Source</span>
            </div>
            <div className="cart-row">
              <div>
                <strong>Selected</strong>
                <p className="muted">
                  {event.selectedProductName} at {event.selectedPharmacyName}
                </p>
              </div>
              <span className="badge">Target</span>
            </div>
            <p className="muted">{event.reason}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
