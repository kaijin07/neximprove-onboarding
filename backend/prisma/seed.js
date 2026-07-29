import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Creates one admin and a few customers so the admin dashboard isn't empty.
// Uses upsert, so running it more than once is safe.

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10)

const seedUsers = [
  {
    name: 'Neximprove Admin',
    email: 'admin@neximprove.com',
    gstin: '07AAACN2082N1Z8',
    password: 'Admin@12345',
    role: 'ADMIN',
  },
  {
    name: 'Acme Exports Pvt Ltd',
    email: 'ops@acmeexports.com',
    gstin: '27AAPFU0939F1ZV',
    password: 'Password123',
    role: 'CUSTOMER',
  },
  {
    name: 'Bluewave Importers',
    email: 'contact@bluewaveimports.com',
    gstin: '29AAACB2894G1ZK',
    password: 'Password123',
    role: 'CUSTOMER',
  },
  {
    name: 'Coastal Freight Traders',
    email: 'hello@coastalfreight.in',
    gstin: '24AAACC1206D1ZM',
    password: 'Password123',
    role: 'CUSTOMER',
  },
]

async function main() {
  console.log('Seeding database...\n')

  for (const { password, ...user } of seedUsers) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const record = await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, gstin: user.gstin, role: user.role },
      create: { ...user, passwordHash },
      select: { email: true, role: true },
    })

    console.log(`  ${record.role.padEnd(8)} ${record.email}`)
  }

  console.log('\nDone. Demo credentials:')
  console.log('  admin     admin@neximprove.com / Admin@12345')
  console.log('  customer  ops@acmeexports.com  / Password123\n')
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
