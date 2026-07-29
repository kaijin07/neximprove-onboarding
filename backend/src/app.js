import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import routes from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { env, isProd, isDev } from './config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()

// In production the app sits behind the host's reverse proxy (Render, Railway,
// Fly). Without this, req.ip is the proxy's address for every visitor, so the
// rate limiter would treat all users as one client and a single busy user could
// lock everyone out. Set to 1 rather than true, so only the immediate proxy is
// trusted and a client can't spoof its IP with a forged X-Forwarded-For header.
if (isProd) {
  app.set('trust proxy', 1)
}

// Security headers: HSTS, nosniff, referrer policy, and removes X-Powered-By so
// the response doesn't advertise Express. The CSP is set explicitly because
// this server also serves the built React app.
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
)

// Only needed in development, where Vite runs on a different port. In
// production Express serves the frontend itself, so requests are same-origin.
// credentials: true is required for the browser to accept the session cookie.
if (!isProd) {
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
}

// Size limit prevents a large request body from exhausting memory.
app.use(express.json({ limit: '10kb' }))

// Parses the session cookie into req.cookies for the auth middleware.
app.use(cookieParser())

if (isDev) app.use(morgan('dev'))

// General limit across the API. /api/auth has a tighter one of its own.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isProd ? 300 : 2000,
  })
)

app.use('/api', routes)

// Registered before the SPA fallback so an unknown /api path returns JSON
// rather than the React app, which would make a typo look like it worked.
app.use('/api', notFoundHandler)

if (isProd) {
  // Serve the built frontend. Anything that isn't /api falls back to
  // index.html so routes like /dashboard survive a refresh or a pasted link.
  const clientDist = path.resolve(__dirname, '../../frontend/dist')

  app.use(express.static(clientDist, { maxAge: '1d', index: false }))
  app.use((_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
} else {
  app.get('/', (_req, res) => {
    res.json({
      service: 'Neximprove Onboarding API',
      mode: 'development',
      frontend: env.CLIENT_URL,
      health: '/api/health',
    })
  })
  app.use(notFoundHandler)
}

// Must be last. Express identifies error handlers by their four arguments.
app.use(errorHandler)

export default app
