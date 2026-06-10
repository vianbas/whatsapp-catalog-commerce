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
- **Order notifications to customer** (PR #63):
  - WhatsApp checkout → "Pesanan Diterima" email sent at order creation (if email provided)
  - Midtrans paid → itemised WhatsApp confirmation + "Konfirmasi Pesanan" email (idempotent — webhook `.neq("payment_status","paid")` prevents duplicate sends on retries)
  - Email field on checkout is optional (UU PDP data minimisation)
  - HTML in emails is escaped to prevent injection from product names / customer names
- **"View Order" button in emails** (PR #68) — CTA button linking to `/orders/[id]` in both email types
- **Shipping tracking** (PR #69) — admin inputs courier + tracking number; customer notified via WA + email with tracking link; shown on `/orders/[id]` timeline
- **Guest order lookup** (PR #70) — `/track` page: enter phone + order ID to view order status without login; backed by `track_order()` SECURITY DEFINER RPC (anon-safe)
- **Invoice PDF** (PR #71) — PDF invoice generated with `pdf-lib` and attached to confirmation emails via Resend `attachments`
- **Guest email link fix** (PR #73) — confirmation/tracking emails for guest orders link to `/track?id=...` instead of login-gated `/orders/[id]`
- **Guest checkout redirect fix** (PR #75) — after WhatsApp/Midtrans checkout, guests are redirected to `/track?id=...` instead of login-gated `/orders`
- **Stock reservation** (PR #77) — atomic check-and-decrement trigger on order insert; concurrent orders for the last unit can't oversell (one wins the row lock, the other's INSERT rolls back with a stock error surfaced to the customer)
- **Stock release on failed payment** (PR #79) — Midtrans orders reserve stock at creation; `settle_payment()` RPC releases it on failed/expired and re-reserves on retry-paid. Also fixed a latent RLS bug: payment settlement now runs via SECURITY DEFINER (webhook is `anon`, check-status is non-admin — both were RLS-blocked from updating orders before)

---

## DB Migrations — ALL DONE ✓

- `db/stock-decrement.sql` — trigger decrements stock on order insert
- `db/discount-codes.sql` — discount_codes table + RLS + apply_discount_code() RPC
- `db/checkout-customer-info.sql` — adds customer_name, customer_phone, customer_address, notes to orders
- `db/product-reviews.sql` — product_reviews table + RLS
- `db/midtrans-payment.sql` — adds payment_status, midtrans_order_id, snap_token, payment_type to orders
- `db/customer-email.sql` — adds customer_email to orders (PR #63)
- `db/shipping-tracking.sql` — adds courier, tracking_number to orders (PR #69, run 2026-06-09)
- `db/track-order-rpc.sql` — creates track_order() SECURITY DEFINER RPC (PR #70, run 2026-06-09)
- `db/stock-reservation.sql` — replaces decrement trigger with atomic check-and-decrement (PR #77, run 2026-06-10)
- `db/payment-settlement.sql` — adds `orders.stock_released` + `settle_payment()` RPC; releases/re-reserves stock on payment status changes (PR #79, run 2026-06-10)

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

## Resend env vars (email notifications)

| Var | Where | Value |
|---|---|---|
| `RESEND_API_KEY` | Wrangler secret (`wrangler secret put`) | from resend.com dashboard |
| `RESEND_FROM` | `wrangler.jsonc` vars | `orders@vikoabastian.com` |

Domain `vikoabastian.com` verified in Resend. Sandbox sender `onboarding@resend.dev` can be used for local testing (delivers only to the Resend account email).

---

## Next / Future Work

Candidate improvements, roughly in priority order. None started yet.

1. **Sandbox end-to-end test of expiry** — drive a real Midtrans sandbox payment to expiry and confirm the webhook releases stock in production (PR #79 verified the DB layer; the live webhook path is untested end-to-end).
2. **`/track` payment-status polling** — guests landing on `/track` after a Midtrans payment see a static status; add light polling so "confirming → paid" updates without a manual refresh (parity with the logged-in `?processing=1` poller).
3. **Admin order search** — `/admin/orders` filters by status only; add search by customer name / phone / order ID.
4. **Dedicated order-confirmed page** — instead of dropping guests on a cold `/track`, a `/order-confirmed?id=` page summarising the order.
5. **Audit other anon/non-admin write paths** — the RLS-blocked `orders` UPDATE (fixed for payments in #79) suggests checking whether any other customer-facing mutation silently no-ops under RLS.

### Skipped indefinitely
- **WhatsApp message templates** — free-form WA messages only work within a 24-hr customer service window; approved Meta templates work anytime but require Meta Business Manager external approval.

---

## Known Gotchas & Patterns

- **Local dev on macOS < 13.5** — `initOpenNextCloudflareForDev()` (in `next.config.ts`) throws `Unhandled Rejection: Unsupported macOS version` because the Cloudflare `workerd` runtime needs macOS 13.5+. This is **non-fatal**: `next dev` still serves every Supabase-backed page (they talk to Supabase over HTTP). Only Cloudflare **bindings** (KV/R2 via `getCloudflareContext()`) are unavailable locally on such machines. To exercise binding-dependent paths, use `npm run preview` / `npm run deploy` (runs on Workers/Linux) or a DevContainer. Don't chase this error during local dev — it's expected on old macOS.
- **postcss pinned via `overrides`** — Next vendors `postcss@8.4.31`, which is flagged by GHSA-qx2v-qp2m-jg93 (XSS). `package.json` → `overrides.postcss: "^8.5.15"` forces every copy (Next, Tailwind, shadcn) onto the patched release; `npm audit` is clean as a result. Keep this until Next bumps its own pin past 8.5.10 — re-check with `npm audit` + `npm ls postcss`, then the override can be dropped.
- **Midtrans order_id max 50 chars** — UUID (36) + `-r` (2) + timestamp slice (10) = 48. Never use full `Date.now()` (13 digits → 51 chars → Midtrans rejects)
- **Anon RLS on INSERT** — never `.insert().select()` for anon users; generate UUID server-side, insert with explicit `id`, no `.select()`
- **NEXT_PUBLIC_* in Cloudflare Builds** — must be hardcoded in `next.config.ts` env block; `process.env.X` inside that block always evaluates to `""` at build time
- **Payment status race condition** — `onSuccess` fires before webhook lands; navigate to `/orders/[id]?processing=1` so `PaymentProcessingPoller` calls `/api/midtrans/check-status` every 3s, which actively queries Midtrans and writes result to DB — resolves in ~3–6s regardless of webhook timing
- **Midtrans inquiry base URL** — Transaction Status API uses `api.sandbox.midtrans.com/v2` (not `app.sandbox.midtrans.com`) — see `src/lib/midtrans.ts`
- **Webhook lookup by `id` not `midtrans_order_id`** — retry-token updates `midtrans_order_id` to the retry ID, so webhook must look up by `orders.id` (base UUID always matches)
- **Snap.js already loaded** — when `window.snap` exists in useEffect, use `setTimeout(() => setState(true), 0)` to avoid setState-in-render lint error
- **Webhook retry order_id stripping** — use `order_id.lastIndexOf("-r")` to find the base UUID; `-r` is safe separator because UUIDs are hex-only
- **Webhook notification idempotency** — `.neq("payment_status","paid")` on the Midtrans webhook UPDATE means retries return null order and skip notifications; prevents duplicate WA/email on Midtrans retries
- **Email HTML escaping** — always use `escapeHtml()` from `src/lib/email.ts` before interpolating user-supplied values (customerName, item names) into HTML strings
- **Currency formatting** — use `formatRupiah` from `src/lib/utils.ts` everywhere; do not create local `formatRp` copies (they produce inconsistent output)
- **Stock reservation** — the `decrement_stock_on_order` trigger raises `Stok tidak cukup untuk produk: <name>` when stock is insufficient, which rolls back the order INSERT. Callers must surface this: WhatsApp checkout `createOrder` must be awaited (not fire-and-forget) and snap-token route forwards the message. `NULL` stock_quantity = unlimited and is skipped.
- **orders is RLS admin-only for UPDATE** — `orders_admin_write` is the only UPDATE policy; `anon` (webhook) and non-admin customers (check-status poller) CANNOT update orders directly. Any payment/order mutation from those paths MUST go through a SECURITY DEFINER RPC (e.g. `settle_payment`). A direct `.update()` silently affects 0 rows. This masked itself in testing because the developer's admin session satisfied the policy.
- **Payment settlement** — always call `settle_payment(order_id, status, payment_type)` rather than updating `payment_status` directly. It bypasses RLS, reconciles reserved stock, and returns `notified=true` only on the single transition into paid so confirmations fire exactly once across webhook + poller.

---

## Dependency Maintenance

Upgrade policy: bump for **security / performance / memory** reasons; hold majors unless one of those forces it. Re-run `npm audit` + `npm outdated` before each release.

**Last upgrade — 2026-06-10 (security + perf):**
- `next` 16.2.6 → **16.2.9**, `eslint-config-next` → 16.2.9
- `react` / `react-dom` 19.2.4 → **19.2.7**
- `@supabase/ssr` 0.10.3 → **0.12.0** · `@supabase/supabase-js` 2.106.2 → **2.108.1**
- `radix-ui` 1.4.3 → **1.5.0** · `react-hook-form` 7.77.0 → **7.78.0** · `wrangler` 4.98.0 → **4.99.0**
- `@types/react` → 19.2.17 · `@types/node` → 20.19.42 (kept on **20** to match the Node/Workers runtime)
- Added `overrides.postcss: ^8.5.15` (see Gotchas) → resolved the only advisory; `npm audit` = 0 vulnerabilities.
- Verified: lint clean, build green (33 routes), runtime smoke test green (home/catalog/product/cart/login all 200, admin gate redirects correctly). Cloudflare-binding paths not exercisable locally (macOS < 13.5 — see Gotchas).

**Held back intentionally (breaking, not security/perf-driven):** `eslint` 9→10, `typescript` 5→6, `@types/node` 20→25. Revisit only when a concrete need arises; do them one-at-a-time on their own branch with a full smoke test.

---

## Key Files

| Purpose | File |
|---|---|
| WhatsApp message builder | `src/lib/whatsapp.ts` |
| Meta Cloud API client | `src/lib/whatsapp-api.ts` |
| Resend email client | `src/lib/email.ts` |
| Invoice PDF generator | `src/lib/invoice.ts` |
| Midtrans API client | `src/lib/midtrans.ts` |
| Order create action | `src/app/orders/actions.ts` |
| Admin order status + tracking actions | `src/app/admin/orders/actions.ts` |
| Admin order detail (with tracking form) | `src/app/admin/orders/[id]/page.tsx` |
| Customer order detail (with tracking section) | `src/app/orders/[id]/page.tsx` |
| Tracking form component | `src/components/order-tracking-form.tsx` |
| Guest order lookup page | `src/app/track/page.tsx` |
| Cart store (localStorage) | `src/lib/cart.ts` |
| Shared DB types | `src/lib/types.ts` |
| Order validation schema | `src/lib/validations/order.ts` |
| Cloudflare config | `wrangler.jsonc` |
| Next.js config | `next.config.ts` |
| Edge middleware | `src/middleware.ts` |
