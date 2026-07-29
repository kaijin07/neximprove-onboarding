import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { env, isDev } from './env.js'

// Prisma 7 requires a driver adapter instead of a bundled query engine.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })

export const prisma = new PrismaClient({
  adapter,
  log: isDev ? ['warn', 'error'] : ['error'],
})

// Fields safe to send to the client. passwordHash is deliberately excluded,
// and every user query uses this so a hash can never end up in a response.
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  gstin: true,
  role: true,
  createdAt: true,
}
