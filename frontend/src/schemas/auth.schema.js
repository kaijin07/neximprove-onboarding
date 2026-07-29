import { z } from 'zod'

// Keep this file in sync with backend/src/schemas/auth.schema.js.
// Used here for instant feedback while typing; the server re-validates every
// request regardless, since anything from the browser can be faked.

// GSTIN is a 15-character Indian GST number:
// 2-digit state code, 10-character PAN, entity number, 'Z', checksum.
// Example: 27AAPFU0939F1ZV
export const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be under 100 characters' }),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Enter a valid email address' })
    .max(255, { message: 'Email must be under 255 characters' }),

  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(GSTIN_REGEX, {
      message: 'Enter a valid 15-character GSTIN (e.g. 27AAPFU0939F1ZV)',
    }),

  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(72, { message: 'Password must be under 72 characters' })
    .regex(/[A-Za-z]/, { message: 'Password must contain a letter' })
    .regex(/[0-9]/, { message: 'Password must contain a number' }),
})

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: 'Enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
})
