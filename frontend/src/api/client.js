import axios from 'axios'

// Relative base URL. In development Vite proxies /api to localhost:5000; in
// production Express serves this app, so /api is already the same origin.
// That means there's no API URL to configure for either environment.
//
// withCredentials tells axios to send cookies with each request. The session
// cookie is httpOnly, so this file never sees the token and never stores one.
export const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// If the session expires while a tab is open, send the user to login with an
// explanation rather than showing an unexplained error.
//
// Skipped for:
//  - login and register, where a 401 means "wrong password" and the form shows
//    it inline
//  - requests marked skipAuthRedirect, used for the check on page load, where a
//    401 just means "not signed in yet" and is expected
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const config = error.config ?? {}
    const isAuthAttempt = (config.url ?? '').includes('/auth/')

    if (status === 401 && !isAuthAttempt && !config.skipAuthRedirect) {
      window.location.assign('/login?expired=1')
    }
    return Promise.reject(error)
  }
)

// Turns an axios error into a form-level message plus per-field messages.
// The API always responds with { message, errors?: [{ field, message }] }, so
// that shape is only understood in this one place.
export function parseApiError(error) {
  const data = error.response?.data

  const fieldErrors = {}
  if (Array.isArray(data?.errors)) {
    for (const item of data.errors) {
      if (item?.field && !fieldErrors[item.field]) {
        fieldErrors[item.field] = item.message
      }
    }
  }

  let message = data?.message
  if (!message) {
    message = error.response
      ? 'Something went wrong. Please try again.'
      : 'Cannot reach the server. Is the API running?'
  }

  return { message, fieldErrors }
}
