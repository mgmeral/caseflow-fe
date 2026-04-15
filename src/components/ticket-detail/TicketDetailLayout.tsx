import type { ReactNode } from 'react'

interface TicketDetailLayoutProps {
  left: ReactNode
  right: ReactNode
}

export function TicketDetailLayout({ left, right }: TicketDetailLayoutProps) {
  return (
    <div className="ticket-detail-shell">
      {/* Left - 65% */}
      <div className="flex min-h-0 flex-col" style={{ maxWidth: '65%', flex: 1 }}>
        {left}
      </div>

      {/* Right - 35% */}
      <div
        className="ticket-detail-side-column"
        style={{ width: '35%' }}
      >
        {right}
      </div>
    </div>
  )
}
