import type { ReactNode } from 'react'

interface TicketDetailLayoutProps {
  left: ReactNode
  right: ReactNode
}

export function TicketDetailLayout({ left, right }: TicketDetailLayoutProps) {
  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left - 65% */}
      <div className="flex flex-col min-h-0" style={{ maxWidth: '65%', flex: 1 }}>
        {left}
      </div>

      {/* Right - 35% */}
      <div
        className="shrink-0 overflow-y-auto border-l border-gray-200/60 bg-gray-50/50"
        style={{ width: '35%' }}
      >
        {right}
      </div>
    </div>
  )
}
