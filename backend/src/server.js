import app from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/prisma.js'

const server = app.listen(env.PORT, () => {
  console.log(`Neximprove Onboarding API`)
  console.log(`mode    ${env.NODE_ENV}`)
  console.log(`url     http://localhost:${env.PORT}`)
  console.log(`health  http://localhost:${env.PORT}/api/health`)
})

// Finish in-flight requests and close the database pool before exiting, so a
// restart or redeploy doesn't cut off a request mid-write.
async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down`)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
