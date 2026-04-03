import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'

interface CloseConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  ticketNo: string
  onConfirm: () => void
  isClosing: boolean
}

export function CloseConfirmModal({
  isOpen,
  onClose,
  ticketNo,
  onConfirm,
  isClosing,
}: CloseConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
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
      </div>
    </Modal>
  )
}
