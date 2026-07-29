import { Router } from 'express'
import { getMe, listUsers } from '../controllers/user.controller.js'
import { requireAuth, requireRole } from '../middleware/auth.js'

const router = Router()

// Applied to the whole router so any route added here is protected by default.
router.use(requireAuth)

router.get('/me', getMe)
router.get('/', requireRole('ADMIN'), listUsers)

export default router
