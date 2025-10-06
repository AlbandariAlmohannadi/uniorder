import React from 'react'
import { useOrders } from '../../contexts/OrderContext'
import OrderCard from './OrderCard'

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

interface OrderListProps {
  orders?: Order[]
}

const OrderList: React.FC<OrderListProps> = ({ orders }) => {
  return (
    <div className="space-y-4">
      {(orders || []).map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  )
}

export default OrderList