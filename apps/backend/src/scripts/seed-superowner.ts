import dotenv from 'dotenv'

dotenv.config()

import { prisma } from '../lib/prisma'

import { Role } from '@prisma/client'

import bcrypt from 'bcryptjs'
async function seedSuperOwner() {

const email = process.env.SUPER_OWNER_EMAIL

const password = process.env.SUPER_OWNER_PASSWORD

if (!email || !password) {

console.error('[seed-superowner] SUPER_OWNER_EMAIL and SUPER_OWNER_PASSWORD must be set in .env')

process.exit(1)

}

const passwordHash = await bcrypt.hash(password, 10)

const existing = await prisma.user.findUnique({ where: { email }, include: { adminPermissions: true } })

if (existing) {

await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, isBlocked: false } })

console.log('[seed-superowner] Super owner updated: ' + email)

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

console.log('[seed-superowner] Super owner created: ' + email)

}

await prisma.$disconnect()

}
seedSuperOwner().catch(console.error)
