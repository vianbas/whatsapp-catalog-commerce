# Project Progress

Live URL: https://whatsapp-catalog-commerce.vikoabastian.workers.dev (Cloudflare Workers)
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
| Checkout form | `/checkout` | Collects name, phone, address, notes before opening WhatsApp |
| Customer orders | `/orders` | Past orders list (login required) |
| Order detail + timeline | `/orders/[id]` | Status timeline + delivery details |

### Admin panel

| Feature | Route |
|---|---|
| Dashboard (revenue + status breakdown) | `/admin` |
| Orders list (filter by status) | `/admin/orders` |
| Order detail + customer info | `/admin/orders/[id]` |
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

---

## Features — PENDING (not yet built)

*(none — all features shipped)*
**Offline reference docs:** `docs/midtrans/REFERENCE.md` (distilled from official SDK source).
Full clones at `~/code/midtrans-reference/` (outside this repo).

#### New env vars needed

| Var | Where | Notes |
|---|---|---|
| `MIDTRANS_SERVER_KEY` | Wrangler secret | Sandbox: starts with `SB-Mid-server-...` |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | `next.config.ts` env block | Baked into bundle at build |
| `MIDTRANS_IS_PRODUCTION` | `wrangler.jsonc` vars | `"false"` for sandbox |

#### DB migration needed

Add to `orders` table (new file: `db/midtrans-payment.sql`):

```sql
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS midtrans_order_id TEXT,
  ADD COLUMN IF NOT EXISTS snap_token TEXT,
  ADD COLUMN IF NOT EXISTS payment_type TEXT;
```

#### Files to create / change

| File | What |
|---|---|
| `src/app/api/midtrans/snap-token/route.ts` | POST — receives cart + customer info, creates Snap token, returns it |
| `src/app/api/midtrans/webhook/route.ts` | POST — verifies SHA-512 sig, updates `payment_status` on order |
| `src/components/midtrans-checkout-button.tsx` | Loads `snap.js`, calls `snap.pay(token, {...})` |
| `src/app/checkout/page.tsx` | Add payment step after existing checkout form |
| `src/lib/midtrans.ts` | `createSnapToken()` and `verifyWebhookSignature()` helpers |
| `src/lib/types.ts` | Add `payment_status`, `midtrans_order_id`, `snap_token`, `payment_type` to `Order` |
| `wrangler.jsonc` | Add `MIDTRANS_IS_PRODUCTION` var |
| `next.config.ts` | Add `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` to env block |
| `db/midtrans-payment.sql` | Migration: 4 new columns on orders |

#### Flow

```
[Checkout form] → [POST /api/midtrans/snap-token]
                       ↓ creates order (status: pending_payment)
                       ↓ calls Midtrans Snap POST /snap/v1/transactions
                       ↓ returns { snapToken }
               → [snap.pay(snapToken)] (Midtrans popup opens)
               → onSuccess/onPending callbacks → redirect to /orders/[id]
               ↓
[POST /api/midtrans/webhook] ← Midtrans POSTs on status change
       ↓ verify SHA-512 signature
       ↓ update orders.payment_status
       ↓ if settled → also trigger WhatsApp notification (existing sendStatusNotification)
       ↓ return 200
```

#### Webhook signature check (Web Crypto — Workers compatible)

```ts
// order_id + status_code + gross_amount + ServerKey → SHA-512 hex
const raw = body.order_id + body.status_code + body.gross_amount + serverKey;
const buf = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(raw));
const sig = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
if (sig !== body.signature_key) return new Response(null, { status: 401 });
```

#### `transaction_status` → `payment_status` mapping

| Midtrans | Our `payment_status` |
|---|---|
| `capture` + fraud `accept` | `paid` |
| `settlement` | `paid` |
| `pending` | `pending` |
| `deny` | `pending` (allow retry) |
| `cancel` / `expire` / `failure` | `failed` |

---

## Key Files

| Purpose | File |
|---|---|
| WhatsApp message builder | `src/lib/whatsapp.ts` |
| Meta Cloud API client | `src/lib/whatsapp-api.ts` |
| Order create action | `src/app/orders/actions.ts` |
| Admin order status action | `src/app/admin/orders/actions.ts` |
| Cart store (localStorage) | `src/lib/cart.ts` |
| Shared DB types | `src/lib/types.ts` |
| Order validation schema | `src/lib/validations/order.ts` |
| Cloudflare config | `wrangler.jsonc` |
| Next.js config | `next.config.ts` |
| Edge middleware | `src/middleware.ts` |
