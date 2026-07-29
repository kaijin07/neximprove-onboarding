import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

// A JWT is signed, not encrypted, so anyone holding it can read the payload.
// Only the user id and role go in it, never the email or password hash.
export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })
}

// Throws if the signature is invalid or the token has expired.
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET)
}
