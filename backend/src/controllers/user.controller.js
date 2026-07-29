import { prisma, publicUserSelect } from '../config/prisma.js'

// GET /api/users/me - powers the dashboard profile view.
// requireAuth already loaded the user from the database, so this just returns it.
export async function getMe(req, res) {
  res.status(200).json({ user: req.user })
}

// GET /api/users - admin only. Lists every onboarded customer.
export async function listUsers(_req, res) {
  const users = await prisma.user.findMany({
    select: publicUserSelect,
    orderBy: { createdAt: 'desc' },
  })

  res.status(200).json({ count: users.length, users })
}
