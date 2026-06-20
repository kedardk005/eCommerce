import React from 'react'
import { Link } from 'react-router-dom'
import { useOrders } from '../context/OrdersContext'
import PageContainer from '../components/PageContainer'
import BadgeTag from '../components/BadgeTag'
import EmptyState from '../components/EmptyState'

export const Orders: React.FC = () => {
  const { orders, loading, error, fetchOrders } = useOrders()

  const getStatusVariant = (status: string): 'red' | 'yellow' | 'green' | 'blue' | 'secondary' | 'default' => {
    switch (status) {
      case 'placed':
        return 'blue'
      case 'confirmed':
        return 'green'
      case 'packed':
        return 'yellow'
      case 'shipped':
        return 'yellow'
      case 'out for delivery':
        return 'blue'
      case 'delivered':
        return 'green'
      case 'cancelled':
        return 'red'
      default:
        return 'default'
    }
  }

  if (loading && orders.length === 0) {
    return (
      <PageContainer className="text-center py-20">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <h2 className="text-xl font-heading text-ink">Loading orders...</h2>
        </div>
      </PageContainer>
    )
  }

  if (error && orders.length === 0) {
    return (
      <PageContainer className="text-center py-20">
        <div className="bg-primary/10 border border-primary/25 p-6 rounded-lg text-primary text-sm font-semibold max-w-md mx-auto text-center space-y-4">
          <p>⚠️ Failed to load orders: {error}</p>
          <button
            onClick={() => fetchOrders()}
            className="btn-primary bg-primary text-white text-xs px-4 py-2 rounded hover:bg-primary-hover font-heading uppercase font-bold tracking-wider"
          >
            Retry Connection
          </button>
        </div>
      </PageContainer>
    )
  }

  if (orders.length === 0) {
    return (
      <PageContainer>
        <EmptyState
          title="No Orders Placed"
          message="You haven't made any purchases yet. Let's browse and make your first order!"
          buttonText="Browse Toy Chest"
          buttonLink="/products"
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer className="space-y-8 pb-16">
      <div className="text-left space-y-1">
        <span className="text-xs uppercase font-heading tracking-widest text-ink-muted font-bold block">Purchase Logs</span>
        <h1 className="text-3xl sm:text-4xl font-heading text-ink tracking-tight mb-1 select-none font-bold">My Orders</h1>
        <p className="text-ink-muted font-body text-sm sm:text-base">Track current shipments and review your order history.</p>
      </div>

      <div className="space-y-5 text-left">
        {orders.map((order) => {
          const totalItemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0)
          const orderDate = new Date(order.timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })

          return (
            <div
              key={order.id}
              className="card-workshop p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-[2.5px] border-border/60 bg-surface shadow-xs"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-heading font-bold text-base sm:text-lg text-ink">
                    Order ID: #{order.id.split('-')[1] || order.id}
                  </span>
                  <BadgeTag text={order.status} variant={getStatusVariant(order.status)} />
                </div>
                <div className="text-xs sm:text-sm font-body text-ink flex flex-wrap gap-x-6 gap-y-1">
                  <p>
                    <span className="text-ink-muted">Date:</span> <strong>{orderDate}</strong>
                  </p>
                  <p>
                    <span className="text-ink-muted">Items:</span> <strong>{totalItemsCount} toys</strong>
                  </p>
                  <p>
                    <span className="text-ink-muted">Total:</span>{' '}
                    <strong className="text-primary">₹{order.total.toFixed(2)}</strong>
                  </p>
                </div>
              </div>

              <div className="shrink-0 w-full sm:w-auto select-none">
                <Link
                  to={`/orders/${order.id}`}
                  className="w-full sm:w-auto text-center py-2 px-6 btn-primary bg-surface hover:bg-bg border border-border text-ink font-heading font-bold text-xs rounded"
                >
                  Manage Order &rarr;
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </PageContainer>
  )
}

export default Orders
