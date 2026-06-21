import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const orders = await prisma.order.findMany({
    include: {
      user: true,
      statusHistory: true
    }
  })
  console.log(`Total orders found: ${orders.length}`)
  for (const o of orders) {
    console.log(`Order ID: ${o.id}, Status: ${o.orderStatus}, User: ${o.user?.email}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
