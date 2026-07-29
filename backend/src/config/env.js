import 'dotenv/config'
import { z } from 'zod'

// Validate environment variables at startup so the server fails immediately
// with a clear message instead of crashing later on the first request.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),

  // bcrypt cost factor. Higher is slower and harder to crack.
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(10),

  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Vite dev server origin, allowed through CORS in development only.
  CLIENT_URL: z.string().default('http://localhost:5173'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('\nInvalid environment configuration:\n')
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`)
  }
  console.error('\nCopy backend/.env.example to backend/.env and fill it in.\n')
  process.exit(1)
}

export const env = parsed.data
export const isProd = env.NODE_ENV === 'production'
export const isDev = env.NODE_ENV === 'development'
