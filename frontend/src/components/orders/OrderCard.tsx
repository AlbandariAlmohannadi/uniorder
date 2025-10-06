import React, { useState } from 'react'
import { useOrders } from '../../contexts/OrderContext'
import { Clock, Phone, MapPin, Package, CheckCircle, XCircle, FileText, Download, Printer, LucideIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import RejectOrderModal from './RejectOrderModal'
import InvoicePrint from './InvoicePrint'

interface Order {
  id: number
  platform_order_id: string
  customer_name: string
  customer_phone: string
  customer_address: string
  order_items: Array<{
    name: string
    quantity: number
    price: number
    notes?: string
  }>
  total_amount: number
  status: string
  created_at: string
  platform: {
    app_name: string
  }
}

interface OrderCardProps {
  order: Order
}

const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const { updateOrderStatus } = useOrders()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-blue-100 text-blue-800'
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800'
      case 'ready':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case 'jahez':
        return 'bg-orange-100 text-orange-800'
      case 'hungerstation':
        return 'bg-red-100 text-red-800'
      case 'keeta':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (isUpdating) return

    setIsUpdating(true)
    try {
      await updateOrderStatus(order.id, newStatus)
      toast.success(`Order status updated to ${newStatus}`)
    } catch (error) {
      toast.error('Failed to update order status')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAccept = async () => {
    if (isUpdating) return
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        await updateOrderStatus(order.id, 'preparing')
        toast.success('Order accepted successfully')
      } else {
        throw new Error('Failed to accept order')
      }
    } catch (error) {
      toast.error('Failed to accept order')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReject = async (reason: string) => {
    try {
      const response = await fetch(`/api/orders/${order.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })
      
      if (response.ok) {
        await updateOrderStatus(order.id, 'cancelled')
      } else {
        throw new Error('Failed to reject order')
      }
    } catch (error) {
      throw error
    }
  }

  const handleMarkReady = async () => {
    if (isUpdating) return
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/ready`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        await updateOrderStatus(order.id, 'ready')
        toast.success('Order marked as ready')
      } else {
        throw new Error('Failed to mark order as ready')
      }
    } catch (error) {
      toast.error('Failed to mark order as ready')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      const response = await fetch(`/api/orders/${order.id}/invoice`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `invoice_${order.platform_order_id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Invoice downloaded successfully')
      } else {
        throw new Error('Failed to download invoice')
      }
    } catch (error) {
      toast.error('Failed to download invoice')
    }
  }

  const handlePrintInvoice = () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast.error('Please allow popups to print invoices')
        return
      }

      const subtotal = order.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const taxRate = 0.15 // 15% VAT
      const taxAmount = subtotal * taxRate

      // Create formatted invoice HTML
      const invoiceHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${order.platform_order_id}</title>
            <style>
              @media print {
                body { margin: 0; }
                .no-print { display: none !important; }
              }
              body { 
                font-family: Arial, sans-serif; 
                max-width: 800px; 
                margin: 0 auto; 
                padding: 20px;
                color: black;
              }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .header h1 { font-size: 28px; margin: 0; color: #333; }
              .header p { font-size: 16px; margin: 5px 0; color: #666; }
              .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .info-section div { flex: 1; }
              .info-section .right { text-align: right; }
              .customer-info { margin-bottom: 30px; }
              .customer-info h3 { margin: 0 0 10px 0; color: #333; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
              th, td { border: 1px solid #ddd; padding: 12px; }
              th { background-color: #f5f5f5; text-align: left; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .totals { display: flex; justify-content: flex-end; }
              .totals-table { min-width: 300px; }
              .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
              .total-final { display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: bold; border-top: 2px solid #333; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>INVOICE</h1>
              <p>UniOrder Restaurant Management System</p>
            </div>
            
            <div class="info-section">
              <div>
                <h3>From:</h3>
                <p><strong>Your Restaurant Name</strong></p>
                <p>123 Restaurant Street</p>
                <p>Riyadh, Saudi Arabia 12345</p>
                <p>Phone: +966 XX XXX XXXX</p>
              </div>
              <div class="right">
                <p><strong>Invoice #:</strong> ${order.platform_order_id}</p>
                <p><strong>Date:</strong> ${formatDate(order.created_at)}</p>
                <p><strong>Platform:</strong> ${order.platform?.app_name || 'Unknown'}</p>
                <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
              </div>
            </div>
            
            <div class="customer-info">
              <h3>Bill To:</h3>
              <p><strong>${order.customer_name}</strong></p>
              <p>${order.customer_phone}</p>
              <p>${order.customer_address}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.order_items.map(item => `
                  <tr>
                    <td>
                      <strong>${item.name}</strong>
                      ${item.notes ? `<div style="font-size: 12px; color: #666; margin-top: 4px;">Note: ${item.notes}</div>` : ''}
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${formatCurrency(item.price)}</td>
                    <td class="text-right">${formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="totals-table">
                <div class="totals-row">
                  <span>Subtotal:</span>
                  <span>${formatCurrency(subtotal)}</span>
                </div>
                <div class="totals-row">
                  <span>VAT (15%):</span>
                  <span>${formatCurrency(taxAmount)}</span>
                </div>
                <div class="total-final">
                  <span>Total:</span>
                  <span>${formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for your business!</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
              <p>This is a computer-generated invoice and does not require a signature.</p>
            </div>
          </body>
        </html>
      `
      
      printWindow.document.write(invoiceHTML)
      printWindow.document.close()
      printWindow.focus()
      
      // Wait a bit for content to load, then print
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
      
      toast.success('Invoice sent to printer')
    } catch (error) {
      toast.error('Failed to print invoice')
    }
  }

  interface ActionButton {
    label: string
    action: () => Promise<void> | void
    color: string
    icon: LucideIcon
  }

  const getNextActions = (): ActionButton[] => {
    const actions: ActionButton[] = []
    
    switch (order.status) {
      case 'received':
        actions.push(
          { label: 'Accept', action: handleAccept, color: 'btn-primary', icon: CheckCircle },
          { label: 'Reject', action: () => setShowRejectModal(true), color: 'btn-danger', icon: XCircle }
        )
        break
      case 'preparing':
        actions.push(
          { label: 'Ready', action: handleMarkReady, color: 'btn-success', icon: CheckCircle }
        )
        break
      case 'ready':
        actions.push(
          { label: 'Complete', action: () => handleStatusUpdate('completed'), color: 'btn-success', icon: CheckCircle }
        )
        break
    }
    
    // Add invoice actions for ready and completed orders
    if (order.status === 'ready' || order.status === 'completed') {
      actions.push(
        { label: 'Print', action: handlePrintInvoice, color: 'btn-secondary', icon: Printer },
        { label: 'Download', action: handleDownloadInvoice, color: 'btn-secondary', icon: Download }
      )
    }
    
    return actions
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className={`order-card slide-in ${order.status}`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-white">
                #{order.platform_order_id}
              </span>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`badge ${getPlatformColor(order.platform?.app_name)}`}>
                  {order.platform?.app_name || 'Unknown'}
                </span>
                <span className={`badge status-${order.status}`}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold" style={{background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              {formatCurrency(order.total_amount)}
            </div>
            <div className="flex items-center text-sm text-white opacity-70 mt-1">
              <Clock className="h-4 w-4 mr-1" />
              {formatTime(order.created_at)}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="glass-card p-3">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-blue-400" />
              <div>
                <div className="font-medium text-white">{order.customer_name}</div>
                <div className="text-sm text-white opacity-70">{order.customer_phone}</div>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-3">
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-green-400 mt-1" />
              <div className="text-sm text-white opacity-80 line-clamp-2">
                {order.customer_address}
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <Package className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-white">
              Items ({order.order_items.length})
            </span>
          </div>
          
          <div className="glass-card p-3 space-y-2">
            {order.order_items.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex-1">
                  <span className="text-white font-medium">
                    {item.quantity}x {item.name}
                  </span>
                  {item.notes && (
                    <div className="text-white opacity-60 text-xs mt-1">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
                <span className="text-white font-semibold">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {getNextActions().length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white border-opacity-20">
            {getNextActions().map((action, index) => (
              <button
                key={`${action.label}-${index}`}
                onClick={action.action}
                disabled={isUpdating}
                className={`btn ${action.color} disabled:opacity-50 flex-1 min-w-0`}
              >
                <action.icon className="h-4 w-4" />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Reject Modal */}
        <RejectOrderModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          onReject={handleReject}
          orderNumber={order.platform_order_id}
        />
    </div>
  )
}

export default OrderCard