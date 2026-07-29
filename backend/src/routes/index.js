import { Router } from 'express'
import authRoutes from './auth.routes.js'
import userRoutes from './user.routes.js'
import { prisma } from '../config/prisma.js'

const router = Router()

// Checks the database too, not just that the server is listening. A running
// server with an unreachable database is the failure worth catching.
router.get('/health', async (_req, res) => {
  let database = 'connected'
  try {
    await prisma.$queryRaw`SELECT 1`
  } catch {
    database = 'disconnected'
  }

  res.status(database === 'connected' ? 200 : 503).json({
    status: database === 'connected' ? 'ok' : 'degraded',
    database,
    timestamp: new Date().toISOString(),
  })
})

router.use('/auth', authRoutes)
router.use('/users', userRoutes)

export default router
