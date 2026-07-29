import bcrypt from 'bcryptjs'
import { prisma, publicUserSelect } from '../config/prisma.js'
import { signToken } from '../utils/jwt.js'
import { setAuthCookie, clearAuthCookie } from '../utils/cookies.js'
import { ApiError } from '../utils/ApiError.js'
import { env } from '../config/env.js'

// POST /api/auth/register
// Sets the session cookie straight away so the user goes to the dashboard
// without having to log in again after signing up.
export async function register(req, res) {
  const { name, email, gstin, password } = req.body

  // Checked here so the user gets an error on the right field. The unique
  // constraints in the database are still the real guarantee, and the error
  // handler turns a P2002 into the same 409 if two signups race.
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { gstin }] },
    select: { email: true },
  })

  if (existing) {
    const field = existing.email === email ? 'email' : 'gstin'
    const message =
      field === 'email'
        ? 'An account with that email already exists'
        : 'That GSTIN is already registered'
    throw ApiError.conflict(message, [
      {
        field,
        message:
          field === 'email'
            ? 'This email is already registered'
            : 'This GSTIN is already registered',
      },
    ])
  }

  // bcrypt generates a random salt per call and stores it inside the hash, so
  // two users with the same password still get different hashes.
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      gstin,
      passwordHash,
      // Set here rather than taken from req.body, otherwise anyone could
      // register as an admin by adding a role field to the request.
      role: 'CUSTOMER',
    },
    select: publicUserSelect,
  })

  // The token goes into an httpOnly cookie and is never sent in the response
  // body, so it never passes through JavaScript at any point.
  setAuthCookie(res, signToken(user))
  res.status(201).json({ user })
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })

  // The same message for an unknown email and a wrong password, so the response
  // can't be used to find out which addresses are registered.
  const invalid = ApiError.unauthorized('Invalid email or password')

  if (!user) {
    // Compare against a dummy hash so a missing account takes roughly as long
    // as a wrong password. Otherwise the response time gives it away.
    await bcrypt.compare(password, '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu')
    throw invalid
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) throw invalid

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    gstin: user.gstin,
    role: user.role,
    createdAt: user.createdAt,
  }

  setAuthCookie(res, signToken(safeUser))
  res.status(200).json({ user: safeUser })
}

// POST /api/auth/logout
// Needed as a server route because the cookie is httpOnly: the browser can't
// delete it from JavaScript, so the server has to clear it.
export async function logout(_req, res) {
  clearAuthCookie(res)
  res.status(200).json({ success: true })
}
