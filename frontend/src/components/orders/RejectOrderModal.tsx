import React, { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface RejectOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onReject: (reason: string) => Promise<void>
  orderNumber: string
}

const REJECTION_REASONS = [
  'Out of Stock',
  'Item Unavailable', 
  'Technical Error',
  'Restaurant Closed',
  'Other'
]

const RejectOrderModal: React.FC<RejectOrderModalProps> = ({
  isOpen,
  onClose,
  onReject,
  orderNumber
}) => {
  const [selectedReason, setSelectedReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedReason) {
      toast.error('Please select a rejection reason')
      return
    }

    const reason = selectedReason === 'Other' ? customReason : selectedReason
    
    if (selectedReason === 'Other' && !customReason.trim()) {
      toast.error('Please provide a custom reason')
      return
    }

    setIsSubmitting(true)
    try {
      await onReject(reason)
      handleClose()
      toast.success('Order rejected successfully')
    } catch (error) {
      toast.error('Failed to reject order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedReason('')
    setCustomReason('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Reject Order #{orderNumber}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for rejection *
            </label>
            <div className="space-y-2">
              {REJECTION_REASONS.map((reason) => (
                <label key={reason} className="flex items-center">
                  <input
                    type="radio"
                    name="reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedReason === 'Other' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom reason *
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Please specify the reason..."
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {customReason.length}/200 characters
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Rejecting...' : 'Reject Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RejectOrderModal