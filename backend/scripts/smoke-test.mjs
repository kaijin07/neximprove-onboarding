// End-to-end API checks.
//
//   1. npm run dev        (one terminal)
//   2. npm run test:api   (another)
//
// Covers the security-relevant behaviour of each endpoint, not just the happy
// path: role enforcement, password handling, and what the responses leak.
//
// Auth uses an httpOnly cookie, so this script keeps a small cookie jar the way
// a browser would. Node's fetch has no cookie store of its own.

const BASE = process.env.API_BASE ?? 'http://localhost:5000'

let passed = 0
let failed = 0

const green = (s) => `\x1b[32m${s}\x1b[0m`
const red = (s) => `\x1b[31m${s}\x1b[0m`

function check(label, condition, detail = '') {
  if (condition) {
    passed++
    console.log(`  ${green('PASS')}  ${label}`)
  } else {
    failed++
    console.log(`  ${red('FAIL')}  ${label}${detail ? '  (' + detail + ')' : ''}`)
  }
}

// Minimal cookie jar: stores name=value pairs and replays them.
function createJar() {
  const cookies = new Map()
  return {
    store(res) {
      for (const raw of res.headers.getSetCookie?.() ?? []) {
        const [pair] = raw.split(';')
        const idx = pair.indexOf('=')
        const name = pair.slice(0, idx).trim()
        const value = pair.slice(idx + 1).trim()
        // An empty value with an expiry in the past is the server clearing it.
        if (value === '') cookies.delete(name)
        else cookies.set(name, value)
      }
      return res
    },
    header() {
      if (cookies.size === 0) return undefined
      return [...cookies].map(([k, v]) => `${k}=${v}`).join('; ')
    },
    has(name) {
      return cookies.has(name)
    },
    raw(res) {
      return res.headers.getSetCookie?.() ?? []
    },
  }
}

async function api(method, path, { body, jar } = {}) {
  const cookieHeader = jar?.header()
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader && { Cookie: cookieHeader }),
    },
    ...(body && { body: JSON.stringify(body) }),
  })

  const setCookie = res.headers.getSetCookie?.() ?? []
  jar?.store(res)

  let json = null
  try {
    json = await res.json()
  } catch {
    // not every response has a JSON body
  }
  return { status: res.status, body: json, setCookie }
}

// Unique per run so the script can be run repeatedly.
const stamp = Date.now().toString().slice(-7)
const testUser = {
  name: 'Smoke Test Exporter',
  email: `smoke.${stamp}@example.com`,
  gstin: `27AAPFU${stamp.slice(-4)}F1ZV`,
  password: 'Password123',
}

console.log(`\nAPI checks against ${BASE}\n`)

console.log('Health')
{
  const { status, body } = await api('GET', '/api/health')
  check('GET /api/health returns 200', status === 200, `got ${status}`)
  check('database reports connected', body?.database === 'connected')
}

console.log('\nRegistration')
const customer = createJar()
{
  const { status, body, setCookie } = await api('POST', '/api/auth/register', {
    body: testUser,
    jar: customer,
  })
  check('valid registration returns 201', status === 201, `got ${status}`)
  check('sets a session cookie', setCookie.length > 0)
  check(
    'session cookie is HttpOnly',
    setCookie.some((c) => /httponly/i.test(c)),
    setCookie[0]
  )
  check(
    'session cookie is SameSite=Strict',
    setCookie.some((c) => /samesite=strict/i.test(c))
  )
  check('response body contains no token', body && !('token' in body))
  check('response has no passwordHash', body?.user && !('passwordHash' in body.user))
  check('new account defaults to CUSTOMER', body?.user?.role === 'CUSTOMER')
  check('email stored lowercase', body?.user?.email === testUser.email.toLowerCase())
}
{
  const { status } = await api('POST', '/api/auth/register', { body: testUser })
  check('duplicate email returns 409', status === 409, `got ${status}`)
}
{
  const { status, body } = await api('POST', '/api/auth/register', {
    body: { ...testUser, email: `other.${stamp}@example.com`, gstin: 'NOT-A-GSTIN' },
  })
  check('invalid GSTIN returns 400', status === 400, `got ${status}`)
  check(
    'error names the gstin field',
    Array.isArray(body?.errors) && body.errors.some((e) => e.field === 'gstin')
  )
}
{
  const { status, body } = await api('POST', '/api/auth/register', {
    body: {
      ...testUser,
      email: `sneaky.${stamp}@example.com`,
      gstin: `29AAPFU${stamp.slice(-4)}F1ZV`,
      role: 'ADMIN',
    },
  })
  check(
    'role sent in the body is ignored',
    status === 201 && body?.user?.role === 'CUSTOMER',
    `role came back as ${body?.user?.role}`
  )
}
{
  const { status, body } = await api('POST', '/api/auth/register', {
    body: {
      ...testUser,
      email: `weak.${stamp}@example.com`,
      gstin: `24AAPFU${stamp.slice(-4)}F1ZV`,
      password: 'short',
    },
  })
  check('weak password returns 400', status === 400, `got ${status}`)
  check(
    'error names the password field',
    Array.isArray(body?.errors) && body.errors.some((e) => e.field === 'password')
  )
}

console.log('\nLogin')
{
  const { status, body } = await api('POST', '/api/auth/login', {
    body: { email: testUser.email, password: 'WrongPassword1' },
  })
  check('wrong password returns 401', status === 401, `got ${status}`)
  check('message is generic', body?.message === 'Invalid email or password')
}
{
  const { body } = await api('POST', '/api/auth/login', {
    body: { email: `nobody.${stamp}@example.com`, password: 'WrongPassword1' },
  })
  check(
    'unknown email gives the same message as a wrong password',
    body?.message === 'Invalid email or password'
  )
}
{
  const { status, body } = await api('POST', '/api/auth/login', {
    body: { email: testUser.email.toUpperCase(), password: testUser.password },
    jar: customer,
  })
  check('login works and email is case-insensitive', status === 200, `got ${status}`)
  check('login response has no passwordHash', body?.user && !('passwordHash' in body.user))
}

console.log('\nAuthorisation')
{
  const { status } = await api('GET', '/api/users/me')
  check('no cookie returns 401', status === 401, `got ${status}`)
}
{
  const forged = createJar()
  forged.store({ headers: { getSetCookie: () => ['neximprove_token=not.a.real.token'] } })
  const { status } = await api('GET', '/api/users/me', { jar: forged })
  check('forged cookie returns 401', status === 401, `got ${status}`)
}
{
  const { status, body } = await api('GET', '/api/users/me', { jar: customer })
  check('valid cookie returns the profile', status === 200, `got ${status}`)
  check('profile has no passwordHash', body?.user && !('passwordHash' in body.user))
}
{
  const { status } = await api('GET', '/api/users', { jar: customer })
  check('customer cannot list all users', status === 403, `got ${status}`)
}

console.log('\nLogout')
{
  const { status } = await api('POST', '/api/auth/logout', { jar: customer })
  check('logout returns 200', status === 200, `got ${status}`)
  check('session cookie is cleared', !customer.has('neximprove_token'))

  const after = await api('GET', '/api/users/me', { jar: customer })
  check('profile is unreachable after logout', after.status === 401, `got ${after.status}`)
}

console.log('\nAdmin')
const admin = createJar()
{
  const { status } = await api('POST', '/api/auth/login', {
    body: { email: 'admin@neximprove.com', password: 'Admin@12345' },
    jar: admin,
  })
  if (status !== 200) {
    check('admin account exists (run npm run db:seed)', false, `login got ${status}`)
  } else {
    const { status: listStatus, body } = await api('GET', '/api/users', { jar: admin })
    check('admin can list all users', listStatus === 200, `got ${listStatus}`)
    check('response includes a count', typeof body?.count === 'number')
    check(
      'no user in the list exposes passwordHash',
      Array.isArray(body?.users) && body.users.every((u) => !('passwordHash' in u))
    )
  }
}

console.log('\nErrors')
{
  const { status, body } = await api('GET', '/api/does-not-exist')
  check('unknown API route returns 404', status === 404, `got ${status}`)
  check('404 is JSON, not HTML', body?.success === false)
}

// Accounts created above all use @example.com, a domain reserved for testing,
// so they can be removed without any risk of deleting a real record.
console.log('\nCleanup')
{
  const { PrismaClient } = await import('@prisma/client')
  const { PrismaPg } = await import('@prisma/adapter-pg')
  await import('dotenv/config')

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  })
  const { count } = await prisma.user.deleteMany({
    where: { email: { endsWith: '@example.com' } },
  })
  await prisma.$disconnect()
  check(`removed ${count} test account(s)`, count > 0)
}

console.log(`\n${'-'.repeat(50)}`)
console.log(`  ${green(passed + ' passed')}${failed ? '   ' + red(failed + ' failed') : ''}`)
console.log(`${'-'.repeat(50)}\n`)

process.exit(failed === 0 ? 0 : 1)
