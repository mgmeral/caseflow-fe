import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { TransferModal } from '@/components/modals/TransferModal'

describe('TransferModal', () => {
  it('allows reviewing and confirming a transfer without a reason when a target group is selected', async () => {
    const onTransfer = vi.fn()

    render(
      <TransferModal
        isOpen
        onClose={vi.fn()}
        ticketId="t1"
        ticketNo="TK-1"
        fromGroupId="g1"
        fromGroupName="Support"
        transferableGroups={[{ id: 'g2', name: 'Trade', groupTypeId: '1', groupTypeCode: 'TRADE', groupTypeName: 'Trade', description: '', isActive: true, memberCount: 0, memberIds: [] }]}
        onTransfer={onTransfer}
        isTransferring={false}
      />,
    )

    const reviewButton = screen.getByRole('button', { name: 'Review Transfer' })
    expect(reviewButton).toBeDisabled()

    await act(async () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'g2' } })
    })

    expect(screen.getByRole('button', { name: 'Review Transfer' })).not.toBeDisabled()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Review Transfer' }))
    })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Confirm Transfer' }))
    })

    expect(onTransfer).toHaveBeenCalledWith('g2', '')
  })
})