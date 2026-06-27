import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting data purge for client handover...')

  // 1. Support Tickets
  console.log('Purging Support Tickets...')
  await prisma.ticketMessage.deleteMany({})
  await prisma.supportTicket.deleteMany({})

  // 2. Returns
  console.log('Purging Returns...')
  await prisma.returnItem.deleteMany({})
  await prisma.return.deleteMany({})

  // 3. Orders and Payments
  console.log('Purging Orders, Payments and Shipments...')
  await prisma.orderStatusHistory.deleteMany({})
  await prisma.orderItem.deleteMany({})
  await prisma.payment.deleteMany({})
  await prisma.shipment.deleteMany({})
  await prisma.order.deleteMany({})

  // 4. Coupons Usages
  console.log('Purging Coupon usages and resetting counters...')
  await prisma.couponUsage.deleteMany({})
  await prisma.coupon.updateMany({
    data: { usedCount: 0 }
  })

  // 5. Audit logs, Activity logs, Notifications
  console.log('Purging Activity Logs and Notification alerts...')
  await prisma.activityLog.deleteMany({})
  await prisma.notification.deleteMany({})

  // 6. Contact Messages
  console.log('Purging Contact Messages...')
  await prisma.contactMessage.deleteMany({})

  // 7. Product Reviews
  console.log('Purging Product Reviews...')
  await prisma.review.deleteMany({})
  // Reset product ratings/reviews aggregates
  await prisma.product.updateMany({
    data: {
      rating: 0.0,
      reviewCount: 0
    }
  })

  // 8. Active carts and wishlists
  console.log('Purging Customer Carts and Wishlists...')
  await prisma.cartItem.deleteMany({})
  await prisma.cart.deleteMany({})
  await prisma.wishlistItem.deleteMany({})
  await prisma.wishlist.deleteMany({})

  // 9. Customer Accounts (retain only super_owner & sub_admin)
  console.log('Purging Customer accounts...')
  await prisma.user.deleteMany({
    where: {
      role: Role.customer
    }
  })

  console.log('Data purge completed successfully!')
}

main()
  .catch((e) => {
    console.error('Purge script execution failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
