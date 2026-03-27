import { useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/shared/Button'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import type { Group } from '@/types/user.types'

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  ticketNo: string
  fromGroupId: string
  fromGroupName: string
  transferableGroups: Group[]
  onTransfer: (toGroupId: string, reason: string) => void
  isTransferring: boolean
}

type Step = 'form' | 'confirm'

const MIN_REASON_LENGTH = 20

export function TransferModal({
  isOpen,
  onClose,
  ticketNo,
  fromGroupName,
  transferableGroups,
  onTransfer,
  isTransferring,
}: TransferModalProps) {
  const [step, setStep] = useState<Step>('form')
  const [toGroupId, setToGroupId] = useState('')
  const [reason, setReason] = useState('')

  const toGroup = transferableGroups.find((g) => g.id === toGroupId)
  const reasonValid = reason.trim().length >= MIN_REASON_LENGTH

  const handleClose = () => {
    onClose()
    // Reset after close animation
    setTimeout(() => {
      setStep('form')
      setToGroupId('')
      setReason('')
    }, 200)
  }

  const handleConfirm = () => {
    if (!toGroupId || !reasonValid) return
    onTransfer(toGroupId, reason.trim())
    handleClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'form' ? `Transfer Ticket ${ticketNo}` : 'Confirm Transfer'}
      size="md"
      footer={
        step === 'form' ? (
          <>
            <Button variant="secondary" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep('confirm')}
              disabled={!toGroupId || !reasonValid}
            >
              Review Transfer
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" size="sm" onClick={() => setStep('form')} disabled={isTransferring}>
              Back
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirm} isLoading={isTransferring}>
              Confirm Transfer
            </Button>
          </>
        )
      }
    >
      {step === 'form' ? (
        <div className="space-y-4">
          {/* From group (readonly) */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Group</label>
            <div className="px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-md text-gray-500">
              {fromGroupName}
            </div>
          </div>

          {/* To group */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Group</label>
            <select
              value={toGroupId}
              onChange={(e) => setToGroupId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select target group...</option>
              {transferableGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Reason for Transfer
              <span className="ml-1 text-gray-400">({MIN_REASON_LENGTH} chars min)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this ticket needs to be transferred..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="mt-1 flex justify-end">
              <span className={reason.trim().length >= MIN_REASON_LENGTH ? 'text-green-600 text-xs' : 'text-gray-400 text-xs'}>
                {reason.trim().length}/{MIN_REASON_LENGTH}+
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4 py-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">From</div>
              <div className="text-sm font-semibold text-gray-700">{fromGroupName}</div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">To</div>
              <div className="text-sm font-semibold text-indigo-700">{toGroup?.name}</div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-500 mb-1">Transfer Reason</div>
            <p className="text-sm text-gray-700">{reason}</p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              This ticket will be moved to <strong>{toGroup?.name}</strong> and the current assignee
              will be unassigned. The transfer will be logged in the ticket history.
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}
