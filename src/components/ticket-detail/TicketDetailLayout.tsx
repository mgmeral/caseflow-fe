import type { ReactNode } from 'react'

interface TicketDetailLayoutProps {
  left: ReactNode
  right: ReactNode
}

export function TicketDetailLayout({ left, right }: TicketDetailLayoutProps) {
  return (
    <div className="flex min-h-[calc(100vh-56px)] overflow-hidden">
      {/* Left - 65% */}
      <div className="flex-1 overflow-y-auto" style={{ maxWidth: '65%' }}>
        {left}
      </div>

      {/* Right - 35% */}
      <div
        className="shrink-0 overflow-y-auto border-l border-gray-200 bg-white sticky top-0"
        style={{ width: '35%', maxHeight: 'calc(100vh - 56px)' }}
      >
        {right}
      </div>
    </div>
  )
}
