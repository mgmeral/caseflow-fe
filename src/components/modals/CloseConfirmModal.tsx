import { useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'

interface CloseConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  ticketNo: string
  onConfirm: (sendNotification: boolean) => void
  isClosing: boolean
}

export function CloseConfirmModal({
  isOpen,
  onClose,
  ticketNo,
  onConfirm,
  isClosing,
}: CloseConfirmModalProps) {
  const [sendNotification, setSendNotification] = useState(true)

  const handleConfirm = () => {
    onConfirm(sendNotification)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Close Ticket ${ticketNo}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isClosing}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={handleConfirm} isLoading={isClosing}>
            Close Ticket
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Are you sure you want to close this ticket? This action will mark the ticket as resolved
          and archive it.
        </p>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={sendNotification}
            onChange={(e) => setSendNotification(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">Send closure notification to customer</span>
        </label>
      </div>
    </Modal>
  )
}
