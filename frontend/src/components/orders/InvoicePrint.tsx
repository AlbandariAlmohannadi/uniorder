import React from 'react'

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

interface InvoicePrintProps {
  order: Order
}

const InvoicePrint: React.FC<InvoicePrintProps> = ({ order }) => {
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

  const subtotal = order.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const taxRate = 0.15 // 15% VAT
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount

  return (
    <div className="invoice-print" style={{ 
      fontFamily: 'Arial, sans-serif', 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: 'white',
      color: 'black'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', margin: '0', color: '#333' }}>INVOICE</h1>
        <p style={{ fontSize: '16px', margin: '5px 0', color: '#666' }}>UniOrder Restaurant Management System</p>
      </div>

      {/* Restaurant and Invoice Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>From:</h3>
          <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Your Restaurant Name</strong></p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>123 Restaurant Street</p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>Riyadh, Saudi Arabia 12345</p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>Phone: +966 XX XXX XXXX</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Invoice #:</strong> {order.platform_order_id}</p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Date:</strong> {formatDate(order.created_at)}</p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Platform:</strong> {order.platform?.app_name || 'Unknown'}</p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Status:</strong> {order.status.toUpperCase()}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Bill To:</h3>
        <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>{order.customer_name}</strong></p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>{order.customer_phone}</p>
        <p style={{ margin: '5px 0', fontSize: '14px' }}>{order.customer_address}</p>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'left' }}>Item</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Qty</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right' }}>Unit Price</th>
            <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.order_items.map((item, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                <div>
                  <strong>{item.name}</strong>
                  {item.notes && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      Note: {item.notes}
                    </div>
                  )}
                </div>
              </td>
              <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right' }}>{formatCurrency(item.price)}</td>
              <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'right' }}>{formatCurrency(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ minWidth: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <span>VAT (15%):</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', fontSize: '18px', fontWeight: 'bold', borderTop: '2px solid #333' }}>
            <span>Total:</span>
            <span>{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '12px', color: '#666', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <p>Thank you for your business!</p>
        <p>Generated on: {new Date().toLocaleString()}</p>
        <p>This is a computer-generated invoice and does not require a signature.</p>
      </div>
    </div>
  )
}

export default InvoicePrint