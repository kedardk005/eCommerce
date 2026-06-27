import { prisma } from '../src/lib/prisma'
import { Role } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  const email = process.env.SUPER_OWNER_EMAIL
  const passwordHash = process.env.SUPER_OWNER_PASSWORD_HASH

  if (!email || !passwordHash) {
    console.error('[Error] SUPER_OWNER_EMAIL and SUPER_OWNER_PASSWORD_HASH must be set in your environment.')
    process.exit(1)
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      include: { adminPermissions: true }
    })

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, isBlocked: false }
      })
      console.log(`[Seed] Super owner user updated: ${email}`)
    } else {
      await prisma.user.create({
        data: {
          name: 'Toy-n-Joy Super Owner',
          email,
          passwordHash,
          role: Role.super_owner,
          emailVerified: true,
          adminPermissions: {
            createMany: {
              data: [
                { permission: 'manage_catalog' },
                { permission: 'manage_orders' },
                { permission: 'manage_customers' },
                { permission: 'manage_returns' },
                { permission: 'manage_support' },
                { permission: 'manage_cms' }
              ]
            }
          }
        }
      })
      console.log(`[Seed] Super owner user created: ${email}`)
    }
  } catch (error) {
    console.error('[Seed] Failed to seed super owner user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
