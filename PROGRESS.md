# Project Progress

Live URL: https://w-commerce.vikoabastian.com (custom domain, Cloudflare Workers)
Repo: https://github.com/vianbas/whatsapp-catalog-commerce

---

## Infrastructure

| What | How |
|---|---|
| Runtime | Cloudflare Workers via `@opennextjs/cloudflare` |
| Database | Supabase (PostgreSQL + RLS + Storage) |
| CI | GitHub Actions — typecheck, lint, build, audit (quality gate only) |
| CD | Cloudflare Builds — auto-deploys on push to `master` |
| Auth | Supabase Auth (email+password, admin only) |

---

## Features — LIVE (merged to master)

### Storefront

| Feature | Route | Notes |
|---|---|---|
| Homepage | `/` | Landing with browse + admin links |
| Product catalog | `/products` | Search, category filter, sort, pagination |
| Category pages | `/categories/[slug]` | Per-category product grid |
| Product detail | `/products/[slug]` | Gallery, stock badge, JSON-LD, related products, star reviews |
| Cart | `/cart` | localStorage, qty controls, promo codes, proceed-to-checkout |
| Checkout form | `/checkout` | Pay Online (Midtrans Snap) as primary; WhatsApp as fallback |
| Midtrans payment | `/api/midtrans/snap-token`, `/api/midtrans/webhook`, `/api/midtrans/retry-token`, `/api/midtrans/check-status` | Snap popup; webhook updates payment_status; retry for unpaid/failed; active inquiry to Midtrans every 3s so payment confirms even if webhook is delayed |
| Customer orders | `/orders` | Past orders list (login required) |
| Order detail + timeline | `/orders/[id]` | Status timeline, delivery details, payment badge + retry button; `?processing=1` auto-polls until payment confirmed |
| Payment status badge | `/orders` | Per-row "Paid / Pending / Unpaid / Failed" badge for Midtrans orders |

### Admin panel

| Feature | Route |
|---|---|
| Dashboard (revenue + status breakdown) | `/admin` |
| Orders list (filter by status) | `/admin/orders` |
| Order detail + customer info + payment status | `/admin/orders/[id]` | Shows "Payment: paid · qris" line for Midtrans orders |
| Products (create, edit, images, stock, featured) | `/admin/products` |
| Low-stock alert banner (stock ≤ 5) | `/admin/products`, `/admin/products/[id]/edit` |
| CSV bulk product import | `/admin/products/import` |
| Categories | `/admin/categories` |
| Discount codes (percent + flat) | `/admin/discounts` |
| Product review moderation | `/admin/reviews` |
| User role management | `/admin/users` |
| Store settings | `/admin/settings` |

### Other
- PWA manifest → installable on mobile home screen
- Loading skeletons on all major pages (instant feedback on navigation)
- SEO: sitemap.xml, robots.txt, JSON-LD Product structured data, Open Graph
- Meta WhatsApp Cloud API webhook at `/api/webhook/whatsapp`
- WhatsApp status notification to customer on admin order status change (fire-and-forget)
- Stock decrement trigger on order insert (DB-level)

---

## DB Migrations — ALL DONE ✓

All run in Supabase SQL editor:

- `db/stock-decrement.sql` — trigger decrements stock on order insert
- `db/discount-codes.sql` — discount_codes table + RLS + apply_discount_code() RPC
- `db/checkout-customer-info.sql` — adds customer_name, customer_phone, customer_address, notes to orders
- `db/product-reviews.sql` — product_reviews table + RLS
- `db/midtrans-payment.sql` — adds payment_status, midtrans_order_id, snap_token, payment_type to orders

---

## Midtrans env vars (production)

| Var | Where | Value |
|---|---|---|
| `MIDTRANS_SERVER_KEY` | Wrangler secret (set via `wrangler secret put`) | sandbox key |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | `next.config.ts` env block (hardcoded) | `Mid-client-2vJCgCtO5msfauEP` |
| `MIDTRANS_IS_PRODUCTION` | `wrangler.jsonc` vars | `"false"` (sandbox) |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | `next.config.ts` env block (hardcoded) | `"false"` (sandbox) |

Webhook URL registered in Midtrans dashboard:
`https://w-commerce.vikoabastian.com/api/midtrans/webhook`

> **Note:** `NEXT_PUBLIC_*` vars must be hardcoded in `next.config.ts` — reading from
> `process.env` inside the env block does not work in Cloudflare Builds.

---

## Features — PENDING (not yet built)

No known pending features. Add next ones here when scoped.

---

## Known Gotchas & Patterns

- **Midtrans order_id max 50 chars** — UUID (36) + `-r` (2) + timestamp slice (10) = 48. Never use full `Date.now()` (13 digits → 51 chars → Midtrans rejects)
- **Anon RLS on INSERT** — never `.insert().select()` for anon users; generate UUID server-side, insert with explicit `id`, no `.select()`
- **NEXT_PUBLIC_* in Cloudflare Builds** — must be hardcoded in `next.config.ts` env block; `process.env.X` inside that block always evaluates to `""` at build time
- **Payment status race condition** — `onSuccess` fires before webhook lands; navigate to `/orders/[id]?processing=1` so `PaymentProcessingPoller` calls `/api/midtrans/check-status` every 3s, which actively queries Midtrans and writes result to DB — resolves in ~3–6s regardless of webhook timing
- **Midtrans inquiry base URL** — Transaction Status API uses `api.sandbox.midtrans.com/v2` (not `app.sandbox.midtrans.com`) — see `src/lib/midtrans.ts`
- **Webhook lookup by `id` not `midtrans_order_id`** — retry-token updates `midtrans_order_id` to the retry ID, so webhook must look up by `orders.id` (base UUID always matches)
- **Snap.js already loaded** — when `window.snap` exists in useEffect, use `setTimeout(() => setState(true), 0)` to avoid setState-in-render lint error
- **Webhook retry order_id stripping** — use `order_id.lastIndexOf("-r")` to find the base UUID; `-r` is safe separator because UUIDs are hex-only

---

## Key Files

| Purpose | File |
|---|---|
| WhatsApp message builder | `src/lib/whatsapp.ts` |
| Meta Cloud API client | `src/lib/whatsapp-api.ts` |
| Midtrans API client | `src/lib/midtrans.ts` |
| Order create action | `src/app/orders/actions.ts` |
| Admin order status action | `src/app/admin/orders/actions.ts` |
| Cart store (localStorage) | `src/lib/cart.ts` |
| Shared DB types | `src/lib/types.ts` |
| Order validation schema | `src/lib/validations/order.ts` |
| Cloudflare config | `wrangler.jsonc` |
| Next.js config | `next.config.ts` |
| Edge middleware | `src/middleware.ts` |
