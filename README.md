# Neximprove - Customer Onboarding Workflow (MVP)

Onboarding flow for customs brokers. An exporter or importer registers with their
business details, gets taken to a dashboard that loads their profile from the API,
and a broker (admin) can see every onboarded customer in one place.

Built for the Neximprove Full Stack Intern task, Option 1.

**Stack:** React 19 + Vite, Express 5, PostgreSQL (Neon), Prisma, bcrypt, JWT

### Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin (customs broker) | `admin@neximprove.com` | `Admin@12345` |
| Customer (exporter) | `ops@acmeexports.com` | `Password123` |

Or register a new account. A valid sample GSTIN: `29ABCDE1234F1Z5`

---

## Contents

- [Requirements checklist](#requirements-checklist)
- [Running it locally](#running-it-locally)
- [How it's put together](#how-its-put-together)
- [Data model](#data-model)
- [API](#api)
- [Security](#security)
- [Interpreting the brief](#interpreting-the-brief)
- [Testing](#testing)
- [What I'd do differently with more time](#what-id-do-differently-with-more-time)

---

## Requirements checklist

| From the brief | Where |
|---|---|
| Registration form with Name, Email, GSTIN | `frontend/src/pages/Register.jsx` |
| Form stores the customer via the backend | `backend/src/controllers/auth.controller.js` |
| Saved to PostgreSQL | `backend/prisma/schema.prisma` |
| Routes to a dashboard with a profile view | `frontend/src/pages/Dashboard.jsx` |
| Dashboard data comes from the API | `GET /api/users/me` on mount |
| Passwords hashed with bcrypt | `auth.controller.js` |
| Frontend routing | `frontend/src/App.jsx` |
| Backend validation | `backend/src/middleware/validate.js` |
| Desktop and mobile friendly | Tailwind; the admin table becomes cards below `md` |
| Bonus: admin dashboard for all users | `frontend/src/pages/AdminDashboard.jsx` |

---

## Running it locally

Requires **Node 20+**. You also need a PostgreSQL database, and there are two
ways to get one. Pick whichever suits you and follow that section start to
finish — they don't need to be combined.

- [Option A: with Docker](#option-a-with-docker) — a local database, nothing to sign up for
- [Option B: without Docker](#option-b-without-docker) — a free hosted database on Neon

Both end with the app running at **http://localhost:5173**.

> The app runs as **two processes in development**: Express on port 5000 and the
> Vite dev server on port 5173. Vite serves the UI and forwards `/api` requests to
> Express, so you need both running. In production it's a single process, because
> Express serves the built frontend itself.

---

### Option A: with Docker

Needs Docker Desktop running.

**1. Start PostgreSQL**

```bash
docker compose up -d
```

This starts Postgres 16 on port 5432 with the database, user and password all set
to `neximprove`. Confirm it's ready:

```bash
docker compose ps
```

Wait until the status shows `healthy` before continuing.

**2. Set up the backend**

```bash
cd backend
npm install
cp .env.example .env
```

**3. Edit `backend/.env`**

Set the connection string to the local database:

```
DATABASE_URL="postgresql://neximprove:neximprove@localhost:5432/neximprove"
```

Then generate a signing key and paste it into `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**4. Create the table and add demo data**

```bash
npx prisma migrate deploy
npm run db:seed
```

**5. Start the API** (leave this terminal running)

```bash
npm run dev            # http://localhost:5000
```

**6. Start the frontend** in a second terminal

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Open http://localhost:5173 and sign in with the demo credentials above.

**To stop:** `Ctrl+C` in both terminals, then `docker compose down`. Add `-v` to
also delete the database contents.

---

### Option B: without Docker

Uses [Neon](https://neon.com), a free hosted PostgreSQL. Nothing to install.

**1. Create a database**

Sign up at [neon.com](https://neon.com), create a project, and copy the
**connection string** from the dashboard. It looks like:

```
postgresql://user:password@ep-something.aws.neon.tech/neondb?sslmode=require
```

**Change `sslmode=require` to `sslmode=verify-full`.** Neon gives you `require`
by default, which encrypts the connection but does not verify the server's
certificate, so it doesn't protect against a man-in-the-middle. `verify-full`
encrypts, verifies the certificate, and checks the hostname.

**2. Set up the backend**

```bash
cd backend
npm install
cp .env.example .env
```

**3. Edit `backend/.env`**

Paste the Neon connection string as `DATABASE_URL`, changing the end from
`?sslmode=require` to `?sslmode=verify-full`. Then generate a signing key and
paste it into `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**4. Create the table and add demo data**

```bash
npx prisma migrate deploy
npm run db:seed
```

**5. Start the API** (leave this terminal running)

```bash
npm run dev            # http://localhost:5000
```

**6. Start the frontend** in a second terminal

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

Open http://localhost:5173 and sign in with the demo credentials above.

> Neon's free tier suspends the database after 5 minutes of inactivity, so the
> first request after a pause takes a second or two while it wakes up.

---

There's no `.env` for the frontend. See
[why there's no API URL](#why-theres-no-api-url).

### Scripts

| Command | Where | Does |
|---|---|---|
| `npm run dev` | both | Dev server with hot reload |
| `npm run db:studio` | backend | Opens Prisma Studio to browse the table |
| `npm run db:seed` | backend | Demo data, safe to run repeatedly |
| `npm run db:deploy` | backend | Applies pending migrations |
| `npm run test:api` | backend | 29 API checks (server must be running) |
| `npm run build` | frontend | Production bundle into `frontend/dist` |

---

## How it's put together

```
   Browser                     Server                      Database
 ------------              ---------------             --------------
  React SPA                  Express API                 PostgreSQL
  /register     -- JSON -->   helmet, cors    -- SQL -->    users
  /login                      rate limit
  /dashboard    <-- cookie -- validate (Zod)  <---------
  /admin                      requireAuth
                              requireRole
                              controllers
                              errorHandler
```

Every write goes through the same chain, and each step can reject before the next
one runs:

```
request
  -> helmet, cors, rate limit, express.json({ limit: '10kb' })
  -> validate(schema)     400 if the input is malformed
  -> requireAuth          401 if the session cookie is missing or invalid
  -> requireRole('ADMIN') 403 if the role is wrong
  -> controller           only clean, authenticated input gets here
  -> errorHandler         one place that shapes every error response
```

Controllers don't validate and don't check authentication. Both are middleware,
so adding a route to `user.routes.js` inherits `requireAuth` automatically rather
than relying on remembering to add it.

### Folders

```
frontend/src/
  api/client.js           axios instance: sends cookies, handles 401s
  components/
    ProtectedRoute.jsx    route guard
    ui/                   Field, Button, Alert
  context/AuthContext.jsx session state
  pages/                  Register, Login, Dashboard, AdminDashboard, NotFound
  schemas/                validation, shared with the backend

backend/
  prisma/schema.prisma    data model and migrations
  scripts/smoke-test.mjs  API checks
  src/
    config/               env validation, Prisma client, field whitelist
    controllers/          request handlers
    middleware/           validate, auth, errorHandler
    routes/               route definitions
    schemas/              validation, shared with the frontend
    utils/                ApiError, JWT helpers
```

### One set of validation rules

`frontend/src/schemas/auth.schema.js` and `backend/src/schemas/auth.schema.js`
have the same contents. The form and the API check against the same rules, so
they can't disagree about what a valid GSTIN is.

The frontend copy exists for instant feedback while typing. **The server
re-validates everything anyway**, because anything sent from a browser can be
faked. Client-side validation is a convenience, never a control.

The two files are duplicated rather than imported from one place, because
`frontend/` and `backend/` are separate npm packages and can't import across that
boundary. The proper fix is an npm workspace with a shared package; I kept the
two-folder layout the brief asked for and accepted the duplication.

### Why there's no API URL

axios uses the relative base `/api`:

- in development, Vite proxies `/api` to `localhost:5000` (see `vite.config.js`)
- in production, Express serves the built React app, so `/api` is the same origin

So there's no `VITE_API_URL` to configure, nothing to get wrong between
environments, and no CORS in production at all. CORS is enabled only in
development, limited to the Vite origin rather than `*`.

---

## Data model

```prisma
model User {
  id           String   @id @default(uuid())
  name         String   @db.VarChar(100)
  email        String   @unique @db.VarChar(255)
  gstin        String   @unique @db.VarChar(15)
  passwordHash String
  role         Role     @default(CUSTOMER)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}

enum Role { CUSTOMER, ADMIN }
```

| Choice | Reason |
|---|---|
| UUID instead of auto-increment | Sequential IDs reveal how many customers exist and let someone walk `/users/1`, `/users/2` |
| Column named `passwordHash` | Makes it obvious from the schema that plain text isn't stored |
| `email` and `gstin` are unique | Enforced by the database, so two simultaneous signups can't both get through an app-level check |
| `role` is an enum with a `CUSTOMER` default | Postgres rejects anything else, and forgetting to set it gives the least privilege |
| One table rather than two | The brief needs one identity with two views; two tables would duplicate the auth logic |

### GSTIN

A 15-character Indian GST number, validated by format rather than treated as free text:

```
27 AAPFU0939F 1 Z V
|  |          | | checksum
|  |          | literal Z
|  |          entity number for that PAN in the state
|  10-character PAN
2-digit state code

/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
```

The checksum digit isn't computed. That's a deliberate scope decision, not an
oversight, and would be the next thing to add.

---

## API

Base URL `/api`. Endpoints marked auth need a valid session cookie, which the
browser sends automatically after registering or logging in.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/health` | public | Server and database status |
| POST | `/auth/register` | public | Create a customer and start a session |
| POST | `/auth/login` | public | Start a session |
| POST | `/auth/logout` | public | Clear the session cookie |
| GET | `/users/me` | auth | Current user's profile (dashboard) |
| GET | `/users` | auth, admin | All users (admin dashboard) |

**POST /api/auth/register**

```jsonc
// request
{ "name": "Acme Exports", "email": "ops@acme.com",
  "gstin": "27AAPFU0939F1ZV", "password": "Str0ngPass1" }

// 201
// Set-Cookie: neximprove_token=...; HttpOnly; SameSite=Strict; Max-Age=86400
{ "user": { "id": "8f3c...", "name": "Acme Exports", "email": "ops@acme.com",
            "gstin": "27AAPFU0939F1ZV", "role": "CUSTOMER",
            "createdAt": "2026-07-29T10:00:00.000Z" } }
```

The session starts on registration, so the user goes straight to the dashboard
instead of having to log in again. The token is only ever in the cookie, never
in the response body. `passwordHash` is not returned, and a `role` sent in the
request body is ignored.

Logout has to be a server route: the cookie is `HttpOnly`, so the browser cannot
delete it from JavaScript and only the server can clear it.

**Errors all have the same shape:**

```jsonc
{ "success": false,
  "message": "Validation failed",
  "errors": [ { "field": "gstin", "message": "Enter a valid 15-character GSTIN" } ] }
```

That means the frontend needs one error handler, and field-level errors can be
attached to the input that caused them.

| Status | Meaning |
|---|---|
| 400 | Validation failed, `errors[]` names the fields |
| 401 | Not authenticated, or wrong credentials |
| 403 | Authenticated but not allowed |
| 404 | No such route or resource |
| 409 | Email or GSTIN already registered |
| 429 | Rate limit hit |

---

## Security

### Passwords

Hashed with bcrypt at cost factor 10. Never stored, logged, or returned.

bcrypt suits this better than a general-purpose hash for two reasons:

**It's slow on purpose.** About 100ms per hash. SHA-256 is fast by design, and a
GPU can compute billions per second, which is exactly what someone with a stolen
database wants. Being slow is the point.

**It salts automatically.** Each call generates a random salt and stores it inside
the hash, so two users with the same password get different hashes. That defeats
precomputed rainbow tables, and cracking one password tells you nothing about any
other.

```
$2b$10$N9qo8uLOickgx2ZMRZoMye...
 |  |  22-character salt, different for every user
 |  cost factor: 2^10 iterations
 bcrypt identifier
```

This uses `bcryptjs` rather than the native `bcrypt` package. Same algorithm and
the same `$2b$` output, but pure JavaScript, so it needs no native build
toolchain and can't fail to compile on a fresh clone.

### Nobody can register as an admin

If the server read `role` from the request body, anyone could POST
`{"role": "ADMIN"}` and become an admin. Two things stop it:

1. `registerSchema` has no `role` field, and `z.object()` drops unknown keys, so
   it's gone before any handler sees the body.
2. The controller sets `role: 'CUSTOMER'` literally, rather than reading it from
   input.

The API test suite checks this rather than assuming it:

```
PASS  role sent in the body is ignored
```

Which raises the obvious question: how does an admin exist at all? Only through
`prisma/seed.js`, which writes the record directly to the database. There is no
API route that creates or promotes an admin, so the only way to get one is
deliberate access to the database. On a real system this would be an admin-only
endpoint with an audit trail; for this scope, seeding is the honest version.

The demo passwords in `seed.js` are in plain text on purpose, because they're
published in this README as demo credentials. Real seed data would read from
environment variables or generate a password and print it once.

### Login doesn't reveal which emails exist

Wrong password and unknown email both return the same message:

```
"Invalid email or password"
```

Different messages would let someone work out which addresses have accounts. So
would timing, so when the email doesn't exist the server still runs a bcrypt
comparison against a dummy hash before failing, instead of returning immediately.

### Password hashes can't leak

Every user query uses one list of fields:

```js
export const publicUserSelect = {
  id: true, name: true, email: true, gstin: true, role: true, createdAt: true,
}
```

It's a list of what to include, not what to exclude. Any sensitive column added
later is left out by default rather than leaking because someone forgot to add it
to an exclusion list.

### SQL injection

Prisma sends values as bound parameters, separate from the query text, so input
is never interpreted as SQL. No query in this project builds SQL by string
concatenation.

### The session is a cookie JavaScript cannot read

The JWT is stored in an `HttpOnly` cookie, not in `localStorage`.

```
Set-Cookie: neximprove_token=eyJhbGci...; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400
```

**Why not `localStorage`.** Anything in `localStorage` can be read by any
JavaScript running on the page. If a single dependency were compromised, or an
XSS hole existed anywhere, `localStorage.getItem('token')` hands the attacker a
working session they can use from their own machine for the next 24 hours.

An `HttpOnly` cookie is not exposed to JavaScript at all. There is no API that
returns its value. An attacker who can run script on the page can still make
requests as the user while they're on it, but they cannot take the session away
with them, which is a much smaller problem.

The token is never in a response body either, so it doesn't pass through
JavaScript at any point in its life.

**Why this doesn't introduce CSRF.** Cookies are sent automatically, which is
normally the thing that makes CSRF possible: another site can trigger a request
that carries your session. `SameSite=Strict` stops that, because the browser
won't attach the cookie to a request started by a different site. Nothing
legitimate is blocked, since the app is same-origin in both development (through
the Vite proxy) and production (Express serves the built frontend).

`Secure` is set in production so the cookie is only ever sent over HTTPS. It's
off in development because local development is HTTP.

### Route protection

- A JWT is signed, not encrypted, so anyone holding it can read the payload. It
  contains only a user id and a role, no email or hash.
- `requireAuth` loads the user from the database on each request instead of
  trusting the token contents, so a deleted or demoted account loses access
  immediately rather than when the token expires.
- Guards are applied at the router level, so a new route is protected by default.
- The frontend `<ProtectedRoute>` is for user experience only. Hiding the admin
  link would mean nothing on its own; `GET /api/users` returns 403 to a customer
  regardless of what the UI shows.
- Because the cookie is invisible to JavaScript, the app cannot tell whether
  someone is signed in without asking. Every page load starts with a call to
  `/users/me`, and the server is the only thing that decides the answer.

### Other measures

| Concern | What's done |
|---|---|
| Security headers | `helmet`: HSTS, nosniff, referrer policy, removes `X-Powered-By` |
| Content Security Policy | Set explicitly, `default-src 'self'`, `frame-ancestors 'none'` |
| CORS | Development only, restricted to the Vite origin, never `*` |
| CSRF | `SameSite=Strict` on the session cookie, so another site can't trigger an authenticated request |
| Brute force | `express-rate-limit`, tighter on `/api/auth` than elsewhere |
| Request size | `express.json({ limit: '10kb' })`, since an unbounded body can exhaust memory |
| Error responses | Unexpected errors are logged server-side; the client gets a generic message, never a stack trace |
| XSS | React escapes interpolated values; `dangerouslySetInnerHTML` isn't used |
| Secrets | `.env` is git-ignored and was never committed; `.env.example` documents the shape |
| Config | The server won't start if `JWT_SECRET` is missing or too short |
| Database connection | `sslmode=verify-full`, so the connection is encrypted **and** the server's certificate and hostname are verified. Neon's default of `require` only encrypts, which leaves it open to a man-in-the-middle |

### npm audit

`npm audit` reports an advisory against `react-router` for a CSRF bypass in RSC
(React Server Components) mode. This app is a client-side SPA with no RSC runtime
and no server actions, so the affected code path isn't present. There's no patched
release in the 7.x line yet and the only suggested fix is a downgrade, so I left
it and noted it here rather than running `npm audit fix --force`.

---

## Interpreting the brief

The brief has an ambiguity worth stating.

It describes customs brokers who register, verify identity, then onboard their
customers. But "Page 1" is a registration form *for* exporters and importers, and
the bcrypt requirement implies whoever fills it in has a password.

Two readings:

- (a) the exporter/importer registers themselves and sees their own dashboard
- (b) the broker logs in and creates customer records for them

This satisfies both, using one table and a `role` column:

```
Exporter/importer registers -> logs in -> sees their own profile   (a)
Admin/broker logs in                   -> sees all customers       (b)
```

Reading (b) is the bonus requirement, which suggests this is the intended shape.
Rather than picking one reading and hoping, I designed the model so both hold.

**On the password field.** The brief lists the form fields as Name, Email and
GSTIN, but also asks for an API with "secure password hash (bcrypt)" and for the
user to be routed to their own dashboard. Both require a password, so the form
has one. It's the only field added beyond the three listed.

**On "dummy data from API".** The dashboard calls `GET /api/users/me` on mount
and renders the response, so the content comes from the API rather than being
hardcoded in the component. I show the user's real stored profile rather than
placeholder text, since that demonstrates the same thing and is more useful.

---

## Testing

There's a script that exercises the API end to end, including the security
behaviour rather than just the happy path:

```bash
cd backend
npm run dev        # terminal 1
npm run test:api   # terminal 2
```

```
Health          endpoint responds, database reachable
Registration    valid signup, duplicate email 409, invalid GSTIN 400,
                weak password 400, role in body ignored, no hash in response
Login           wrong password 401, same message for unknown email,
                email is case-insensitive
Authorisation   no cookie 401, forged cookie 401, customer hitting admin route 403
Logout          cookie cleared, profile unreachable afterwards
Admin           can list all users, no hash on any record
Errors          unknown route returns JSON 404, not HTML
Cleanup         test accounts removed

35 passed
```

Accounts it creates use `@example.com`, a domain reserved for testing, and are
deleted at the end, so running it repeatedly doesn't fill up the table.

There are no unit tests. That's the main gap.

---

## What I'd do differently with more time

| Now | Instead |
|---|---|
| One 24-hour session, no refresh | Short access token plus a rotating refresh token, so a stolen session expires in minutes rather than a day |
| No server-side session revocation | A token stays valid until it expires. A denylist, or session records in the database, would let an admin end a session immediately |
| No unit tests | Vitest for the schemas and utilities, Supertest for routes |
| JavaScript | TypeScript on both sides, with types inferred from the Zod schemas |
| GSTIN format check | Verify the checksum digit too |
| Validation schema duplicated in two folders | An npm workspace with a shared package |
| No email verification | Verify the address before the account is usable |
| Role changed directly in the database | An admin-only endpoint with an audit trail |

---

## Deployment

It deploys as **one service**. The frontend builds to `frontend/dist`, which
Express serves alongside the API, so there's a single URL and no CORS in
production. Any path that isn't `/api` falls back to `index.html`, so client-side
routes survive a refresh or a pasted link.

Two commands do everything:

```bash
npm run build     # installs both packages, applies migrations, builds the frontend
npm start         # starts Express, serving the API and the built frontend
```

### Environment variables

| Variable | Value |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Long random string, 32 characters minimum |
| `NODE_ENV` | `production` |
| `PORT` | Usually set by the host automatically |

`NODE_ENV=production` matters for more than logging. It turns on the `Secure`
flag for the session cookie, turns off CORS (unnecessary once the frontend is
same-origin), tightens the rate limits, and switches Express to serving the built
frontend.

### Deploying to Render

The repo includes a [`render.yaml`](render.yaml) blueprint, so no manual service
configuration is needed:

1. Push to GitHub
2. In Render, choose **New > Blueprint** and pick the repository
3. Paste your `DATABASE_URL` when prompted (`JWT_SECRET` is generated automatically)
4. Deploy

The build applies any pending migrations before the server starts, so the
database schema always matches the deployed code.

**Health check:** `/api/health` returns 200 only when the database is reachable
too, so a deploy with a broken connection string is caught rather than sitting
there serving errors.

**On the free tier**, the service sleeps after about 15 minutes of inactivity and
the first request afterwards takes roughly 50 seconds to wake it. Neon's free
tier also suspends after 5 minutes idle, adding a second or two on top.

### Behind a proxy

`trust proxy` is enabled in production. Hosts like Render put a reverse proxy in
front of the app, so without it `req.ip` would be the proxy's address for every
visitor. The rate limiter would then treat everyone as a single client, and one
busy user could lock out the rest. It's set to `1` rather than `true` so only the
immediate proxy is trusted and a client can't spoof its address with a forged
`X-Forwarded-For` header.
