// Error with an HTTP status attached. Controllers throw these and the central
// error handler turns them into responses, so no controller needs res.status().
export class ApiError extends Error {
  constructor(status, message, errors = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    // Marks errors we raised on purpose, as opposed to unexpected crashes.
    this.isOperational = true
  }

  static badRequest(message, errors) {
    return new ApiError(400, message, errors)
  }
  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message)
  }
  static forbidden(message = 'You do not have permission to do that') {
    return new ApiError(403, message)
  }
  static notFound(message = 'Resource not found') {
    return new ApiError(404, message)
  }
  static conflict(message, errors) {
    return new ApiError(409, message, errors)
  }
}
