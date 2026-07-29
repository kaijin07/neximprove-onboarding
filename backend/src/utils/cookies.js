import jwt from 'jsonwebtoken'
import { isProd } from '../config/env.js'

export const AUTH_COOKIE = 'neximprove_token'

// Sets the session cookie.
//
// httpOnly means JavaScript cannot read it, so a script injected into the page
// can't steal the token the way it could from localStorage.
//
// sameSite 'strict' means the browser won't attach the cookie to requests
// started by another site, which is what stops CSRF. The app is same-origin in
// both development (through the Vite proxy) and production (Express serves the
// built frontend), so nothing legitimate is blocked by this.
//
// secure is off in development because it requires HTTPS and local dev is HTTP.
export function setAuthCookie(res, token) {
  // Read the expiry back out of the token we just signed, so the cookie and the
  // token can never disagree about when the session ends.
  const { exp } = jwt.decode(token)

  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: exp * 1000 - Date.now(),
    path: '/',
  })
}

// Options must match the ones used to set it, or the browser won't remove it.
export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/',
  })
}
