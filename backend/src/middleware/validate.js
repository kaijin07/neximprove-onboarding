import { ApiError } from '../utils/ApiError.js'

// Validates req.body against a Zod schema and replaces it with the parsed
// result, so controllers get trimmed/normalised values and unknown keys are
// already stripped. Kept as middleware so a new route can't skip validation.
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body)

  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }))
    return next(ApiError.badRequest('Validation failed', errors))
  }

  req.body = result.data
  next()
}
