import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { register, login, logout } from '../controllers/auth.controller.js'
import { validate } from '../middleware/validate.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'
import { isProd } from '../config/env.js'

const router = Router()

// Login and registration are the endpoints worth brute-forcing, so they get a
// tighter limit than the rest of the API. Relaxed outside production so testing
// and demos don't trip it.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 20 : 200,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in a few minutes.',
  },
})

router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)

// Not rate limited: signing out should always work.
router.post('/logout', logout)

export default router
