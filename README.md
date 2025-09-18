## eCommerce — Next.js + Prisma + NextAuth + Redis

Modern, minimalist storefront built on the Next.js App Router with a PostgreSQL-backed product catalog, credential-based auth, and a Redis‑powered cart with a slide‑over UI. Includes an admin dashboard integrated into the account page for adding, editing, and deleting products.

## Tech Stack

- Next.js 15 (App Router) + React 19
- TypeScript
- Tailwind CSS v4 via `@tailwindcss/postcss` (see `src/app/globals.css`)
- Prisma ORM + PostgreSQL (schema in `public/prisma/schema.prisma`)
- NextAuth (Credentials provider, JWT sessions)
- Passwords: salted scrypt hashing (`src/lib/password.ts`)
- Redis cart via `ioredis` with a dev in‑memory fallback (`src/lib/redis.ts`)
- Stripe checkout (minimal demo endpoints)

## Key Features

- Home page product grid (3 per row), data from DB (`src/app/page.tsx`)
- Product detail page with “Add to cart” (`src/app/products/[slug]/page.tsx`)
- Cart slide‑over with quantity controls (`src/app/cart/*`)
- Admin product management inside Account page (`/account`): list, add, edit, delete
- DB revalidation on catalog changes to update the storefront immediately

## Notable Files

- Database
  - `public/prisma/schema.prisma` — full relational schema
  - `public/prisma/seed.js` — seeds categories, products, and two users with hashed passwords
- Auth
  - `src/lib/auth.ts` — NextAuth config (Credentials provider)
  - `src/lib/password.ts` — salted scrypt hash/verify helpers
  - `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handler
  - `src/app/(auth)/login/page.tsx` and `src/app/(auth)/register/page.tsx`
- Catalog
  - `src/app/page.tsx` — product grid
  - `src/app/products/[slug]/page.tsx` — product detail
- Cart
  - `src/lib/redis.ts` — Redis client with memory fallback for local dev
  - `src/app/api/cart/*` — add, get, update
  - `src/app/cart/CartTrigger.tsx` and `src/app/cart/cartSlideOver.tsx`
- Admin
  - `src/app/account/page.tsx` — account + admin products dashboard
  - `src/app/account/products/new/page.tsx` — add product form
  - `src/app/api/admin/products/route.ts` — create
  - `src/app/api/admin/products/[id]/route.ts` — update
  - `src/app/api/admin/products/[id]/delete/route.ts` — delete

## Setup

1) Install

```bash
npm install
```

2) Environment

Create `.env.local` with at least:

```
DATABASE_URL=postgres://user:pass@host:5432/db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<long-random-string>
# Optional for real Redis; if not set, a dev in-memory cart is used
# REDIS_URL=redis://localhost:6379

# Optional for Stripe demo
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...
```

3) Database & Seed

Run migrations and seed using the project’s Prisma schema under `public/prisma`:

```bash
npx prisma migrate dev --schema public/prisma/schema.prisma
npx prisma db seed --schema public/prisma/schema.prisma
```

Seeded accounts:
- `admin@example.com` / `admin123`
- `customer@example.com` / `customer123`

4) Dev server

```bash
npm run dev
```

## How It Works

- Authentication
  - NextAuth Credentials provider checks the user by email with Prisma and verifies a salted scrypt hash. JWT sessions include `user.id` and `user.role`.
- Cart
  - Add-to-cart posts to `/api/cart/add` and fires a `cart:open` event. The drawer fetches `/api/cart` to join cart lines (in Redis) with product details (via Prisma). If `REDIS_URL` is unset, a dev in‑memory store is used.
- Admin product management
  - Admin sees a product dashboard on `/account`. Create/update/delete hit `/api/admin/products...` routes which revalidate `/` and `/account` to refresh UI.
- Styling
  - Tailwind v4 utilities loaded via `@tailwindcss/postcss` and `src/app/globals.css`.

## Common Issues

- NextAuth decryption error: set a stable `NEXTAUTH_SECRET`, restart dev, and clear NextAuth cookies.
- Redis “send_command … undefined”: if no `REDIS_URL`, the app uses a memory fallback; set `REDIS_URL` to a real instance for persistence.
- Params must be awaited (Next.js 15): dynamic route/page/route handlers read `params` as a promise (e.g., `const { id } = await params`).

## Operational Notes

- Production should use a real Redis and a strong, rotated `NEXTAUTH_SECRET`.
- Password policy checks and rate limiting can be added to the auth routes for extra protection.

## Deployment

You can deploy this Next.js app to Vercel or any host that can run a Node server. You’ll also need managed Postgres, Redis, and Stripe keys.

1) Provision services
- Postgres (Neon, Supabase, RDS, etc.) — note the connection string
- Redis (Upstash, Valkey/Redis provider) — note the connection string
- Stripe account — get secret key and (optional) webhook secret

2) Configure environment variables on your host

```
DATABASE_URL=postgres://user:pass@host:5432/db
NEXTAUTH_URL=https://your-domain
NEXTAUTH_SECRET=<long-random-string>
STRIPE_SECRET_KEY=sk_live_or_test
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test
REDIS_URL=redis://... (or provider URL)
# Optional if using webhooks
STRIPE_WEBHOOK_SECRET=whsec_...
```

3) Build and run migrations in CI/Deploy step

```
npm run build
npx prisma migrate deploy --schema public/prisma/schema.prisma
```

4) Start the app
- Vercel: push to your repo; set a Build Command to also run `prisma migrate deploy` (via a postbuild script or deploy hook). Vercel handles the server.
- Other hosts (Fly.io/Render/Railway/VPS): run `next start` or the standalone server, and put it behind TLS (Nginx/Caddy).

5) (Optional) Stripe webhook
- Add endpoint `https://your-domain/api/stripe/webhook` for events like `payment_intent.succeeded`.
- Set `STRIPE_WEBHOOK_SECRET` in your environment.

Notes (Windows/OneDrive): if `npx prisma generate` fails with EPERM locally, stop Node, delete `node_modules/.prisma`, pause OneDrive, reinstall, then regenerate. You can also set `PRISMA_CLIENT_ENGINE_TYPE=library` while generating.
