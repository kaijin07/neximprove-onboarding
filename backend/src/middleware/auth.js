import { prisma, publicUserSelect } from '../config/prisma.js'
import { verifyToken } from '../utils/jwt.js'
import { AUTH_COOKIE } from '../utils/cookies.js'
import { ApiError } from '../utils/ApiError.js'

// Reads the session cookie, verifies it, then loads the user from the database
// and puts it on req.user. Reading from the database rather than trusting the
// token payload means a deleted or demoted account loses access straight away
// instead of when the token expires.
export async function requireAuth(req, _res, next) {
  const token = req.cookies?.[AUTH_COOKIE]

  if (!token) return next(ApiError.unauthorized('Not signed in'))

  try {
    const payload = verifyToken(token)

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: publicUserSelect,
    })

    if (!user) return next(ApiError.unauthorized('Account no longer exists'))

    req.user = user
    next()
  } catch {
    // Same message for an invalid signature and an expired token, so the
    // response doesn't tell a caller which one it was.
    next(ApiError.unauthorized('Invalid or expired session'))
  }
}

// Used after requireAuth: router.get('/', requireAuth, requireRole('ADMIN'), ...)
export const requireRole =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized())

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('This area is restricted to administrators'))
    }
    next()
  }
