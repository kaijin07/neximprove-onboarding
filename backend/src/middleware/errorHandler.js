import { ApiError } from '../utils/ApiError.js'
import { isProd } from '../config/env.js'

// Runs when no route matched.
export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`))
}

// Every error ends up here, so all error responses share one shape and the
// frontend only needs a single error handler. Express 5 forwards rejected
// promises automatically, so controllers don't need try/catch.
export function errorHandler(err, req, res, _next) {
  let status = err.status || 500
  let message = err.message || 'Something went wrong'
  let errors = err.errors || []

  // Unique constraint violation, e.g. duplicate email or GSTIN.
  if (err.code === 'P2002') {
    status = 409
    const targets = Array.isArray(err.meta?.target)
      ? err.meta.target
      : [err.meta?.target].filter(Boolean)
    const field = targets[0] ?? 'field'
    const label = field === 'gstin' ? 'GSTIN' : field
    message = `That ${label} is already registered`
    errors = [{ field, message }]
  }

  if (err.code === 'P2025') {
    status = 404
    message = 'Resource not found'
  }

  // express.json() throws this on a malformed body.
  if (err instanceof SyntaxError && 'body' in err) {
    status = 400
    message = 'Request body is not valid JSON'
  }

  // Unexpected errors get logged in full but aren't sent to the client, since
  // stack traces and driver messages reveal file paths and schema details.
  const isTrusted = err instanceof ApiError || status < 500
  if (!isTrusted) {
    console.error(`${req.method} ${req.originalUrl}`)
    console.error(err)
    if (isProd) message = 'Internal server error'
  }

  res.status(status).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors }),
  })
}
