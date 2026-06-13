# WhatsApp Catalog Commerce

A mobile-first product-catalog storefront for Indonesian small sellers. Customers browse products and check out via **Midtrans Snap** (card, GoPay, QRIS, bank transfer) or by sending a pre-filled order to the store's **WhatsApp**. A protected admin panel handles catalog management, order tracking, and shipping.

Live: **https://w-commerce.vikoabastian.com**

---

## 1. Product summary

Sellers manage their catalog (products, categories, discount codes, store settings) in a protected admin area. Shoppers browse a fast, mobile-first storefront and either pay online via Midtrans or tap **"Order via WhatsApp"**. After checkout, guests land on an order-confirmation page and can track their order status at `/track` without an account.

Key design decisions:
- Shoppers can check out as **guests** (phone + name only) or **register** for an account to track orders by email. The only privileged users are admins/staff.
- The WhatsApp handoff is the product for small sellers — Midtrans is an optional online-payment layer on top.
- Payment mutations that run as `anon` or non-admin auth go through **SECURITY DEFINER RPCs** so RLS never silently blocks them.

---

## 2. Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 · shadcn/ui · Radix UI |
| Icons / Font | Lucide · Inter |
| Data | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth (email/password — admin, staff, customer roles) |
| Storage | Supabase Storage (`product-images` bucket) |
| Payment | Midtrans Snap (card, GoPay, QRIS, bank transfer) |
| Email | Resend (order received + payment confirmed + shipping; PDF invoice attached) |
| PDF | pdf-lib (invoice generation) |
| WhatsApp | Meta WhatsApp Cloud API (store-owner + customer notifications) |
| Validation | Zod + React Hook Form |
| Deployment | Cloudflare Workers via `@opennextjs/cloudflare` |
| CI | GitHub Actions (typecheck + lint + build + audit) |
| CD | Cloudflare Builds (auto-deploy on push to `master`) |

> **Next.js 16 breaking changes:** Route `params`/`searchParams`/`cookies()` are all **async**. Next.js 16 prefers `proxy.ts` over `middleware.ts`, but this project intentionally keeps `src/middleware.ts` (Edge-compatible) because `proxy.ts` is Node.js-only and Cloudflare Workers require the Edge runtime. See `AGENTS.md`.

---

## 3. Features

### Storefront
- Product catalog with search, category filter, sort, pagination
- Product detail with gallery, stock badge, star reviews, JSON-LD structured data
- Cart with localStorage persistence, qty controls, and promo/discount codes
- **Checkout**: Midtrans Snap (primary) + WhatsApp (fallback); works for guests and registered customers
- **Order-confirmed page** (`/order-confirmed`) — success screen after guest checkout with order summary, payment badge, and live payment polling
- **Guest order tracking** (`/track`) — enter phone + order ID to view status without an account; auto-polls until Midtrans payment is confirmed
- **Customer accounts** — register (`/register`) or sign in (`/login`); `/orders` shows order history; auth-aware nav (Sign in / Register / My Orders / Sign out) on catalog header
- PWA manifest, loading skeletons, Open Graph, sitemap

### Admin (`/admin`)
- Dashboard with revenue total and per-status order counts
- Orders list with status filter and search (by customer name, phone, or order ID)
- Order detail: items, customer info, payment status, shipping tracking form
- Products: create/edit, image upload, stock management, featured flag, low-stock alert, CSV bulk import
- Categories, discount codes (percent + flat), product review moderation
- User role management, store settings

### Payments & notifications
- Midtrans Snap popup; `?processing=1` poller actively queries Midtrans every 3 s until payment resolves
- Webhook at `/api/midtrans/webhook` — verifies signature, calls `settle_payment()` SECURITY DEFINER RPC (handles RLS + stock reconciliation + idempotent notifications)
- Stock reserved atomically on order insert; released on `expire`/`cancel`/`failure`; re-reserved on retry-paid
- Fire-and-forget emails via Resend: "order received" on WhatsApp checkout; "payment confirmed" + PDF invoice on Midtrans `paid`
- WhatsApp notifications to customer on admin status change and shipping update

---

## 4. Architecture

```
.
├── db/
│   ├── schema.sql              # tables, triggers, is_admin(), list_users()
│   ├── rls.sql                 # row-level security policies
│   ├── storage.sql             # product-images bucket + upload policies
│   ├── seed.sql                # demo categories / products / settings
│   ├── product-reviews.sql     # product_reviews table + anon INSERT policy
│   ├── discount-codes.sql      # discount_codes + apply_discount_code() RPC
│   ├── midtrans-payment.sql    # payment_status, snap_token, payment_type columns
│   ├── customer-email.sql      # customer_email column on orders
│   ├── shipping-tracking.sql   # courier, tracking_number columns
│   ├── track-order-rpc.sql     # track_order() SECURITY DEFINER RPC
│   ├── stock-reservation.sql   # atomic check-and-decrement stock trigger
│   ├── payment-settlement.sql  # stock_released + settle_payment() SECURITY DEFINER RPC
│   └── customer-accounts.sql   # customer role + store_snap_ids() RPC
├── src/
│   ├── middleware.ts            # session refresh + /admin gate
│   ├── app/
│   │   ├── page.tsx             # landing
│   │   ├── login/               # sign-in (admin, staff, customer)
│   │   ├── products/            # catalog list + [slug] detail + review action
│   │   ├── categories/[slug]/   # per-category grid
│   │   ├── cart/                # cart page
│   │   ├── checkout/            # checkout form (Midtrans + WhatsApp)
│   │   ├── order-confirmed/     # guest post-checkout success page
│   │   ├── orders/              # customer order list + [id] detail (login required)
│   │   ├── track/               # guest order lookup
│   │   ├── admin/               # dashboard, orders, products, categories,
│   │   │                        #   discounts, reviews, users, settings
│   │   └── api/
│   │       ├── midtrans/        # snap-token, webhook, retry-token, check-status
│   │       └── webhook/whatsapp/ # Meta WA Cloud API webhook
│   ├── components/
│   │   ├── checkout-form.tsx
│   │   ├── track-payment-poller.tsx  # client poller for /track + /order-confirmed
│   │   ├── payment-retry-button.tsx  # Snap retry for logged-in users
│   │   ├── midtrans-checkout-button.tsx
│   │   └── ui/                  # shadcn/ui primitives
│   └── lib/
│       ├── types.ts             # DB row types
│       ├── utils.ts             # cn(), formatRupiah()
│       ├── cart.ts              # localStorage cart store (Zustand-style)
│       ├── midtrans.ts          # createSnapToken, verifyWebhookSignature, mapPaymentStatus
│       ├── email.ts             # Resend client + HTML email templates
│       ├── invoice.ts           # pdf-lib invoice generator
│       ├── order-notifications.ts  # fire-and-forget WA + email on payment confirmed
│       ├── whatsapp.ts          # wa.me link builder
│       ├── whatsapp-api.ts      # Meta Cloud API client
│       ├── supabase/            # browser.ts, server.ts
│       └── validations/         # Zod schemas: order, product, category, …
```

**Data flow:**
- Server Components read the catalog via the Supabase *server* client (anon key + RLS).
- Guest mutations (order insert, review insert) run as `anon`; no `.select()` after insert.
- Payment mutations that need elevated access use SECURITY DEFINER RPCs (`settle_payment`, `track_order`, `apply_discount_code`) — direct `.update()` on `orders` is admin-only.
- `src/middleware.ts` refreshes the session cookie on every request and redirects unauthenticated access away from `/admin`.

---

## 5. Database schema

| Table | Purpose |
|---|---|
| `profiles` | One row per authenticated user (FK to `auth.users`); `role: admin\|staff\|customer` |
| `categories` | `name`, unique `slug`, `is_active`, `sort_order` |
| `products` | `category_id`, `name`, `slug`, `price`/`compare_at_price` (whole Rupiah), `images text[]`, `stock_status`, `stock_quantity`, `is_featured`, `is_active` |
| `product_reviews` | `product_id`, `reviewer_name`, `rating`, `body`, `is_approved` (admin-gated) |
| `discount_codes` | `code` (case-insensitive unique), `type: percent\|flat`, `value`, `max_uses`, `uses`, `expires_at` |
| `store_settings` | Singleton: `store_name`, `whatsapp_number`, `checkout_message_template` |
| `orders` | Full order record: items (JSONB), total, source, customer info, `payment_status`, `midtrans_order_id`, `stock_released`, courier, tracking |

**Key RPCs (SECURITY DEFINER):**
- `settle_payment(order_id, status, payment_type)` — applies payment status, reconciles reserved stock, returns `notified=true` on the single `paid` transition (idempotent).
- `track_order(phone, order_id)` — anon-safe order lookup for `/track`.
- `apply_discount_code(code)` — atomically validates + increments `uses`.
- `store_snap_ids(order_id, snap_token, midtrans_order_id)` — stores Midtrans token fields, bypassing `orders_admin_write` RLS so non-admin customers can store their payment IDs; COALESCE preserves existing values when NULL is passed.

Apply DB files in order: `schema.sql` → `rls.sql` → `storage.sql` → then the rest in any order (including `customer-accounts.sql` for customer account support).

---

## 6. Security

- **RLS on every table.** Anon users may INSERT orders and reviews (no read-back). Catalog is public read. Only `is_admin()` users may UPDATE/DELETE.
- **No service-role key in app code.** Both browser and server Supabase clients use only `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **SECURITY DEFINER RPCs** for any write path that runs as `anon` or non-admin auth (webhook, guest order tracking, discount validation, payment settlement).
- **Midtrans webhook** verified by SHA-512 signature (`order_id + status_code + gross_amount + server_key`) before any DB write.
- **Route protection:** `src/middleware.ts` blocks `/admin` for unauthenticated users; admin layout re-checks `profiles.role = 'admin'` (defense in depth).
- Role bootstrapping: first signup becomes `admin`, later signups become `customer` (staff is promoted manually by admin). `db/schema.sql` backfills existing users.

---

## 7. Local development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local   # fill in Supabase, Midtrans, Resend, WhatsApp values

# 3. Apply the database (Supabase SQL editor), in order:
#    schema.sql → rls.sql → storage.sql → (remaining db/*.sql files)

# 4. Create an admin user in Supabase Auth (Add user → Create new user + Auto Confirm)

# 5. Run the dev server
npm run dev
```

Visit `http://localhost:3000` for the storefront and `/admin` for the admin panel.

> **macOS < 13.5:** `initOpenNextCloudflareForDev()` throws a non-fatal workerd error on startup. `next dev` still serves all Supabase-backed pages normally. Only Cloudflare bindings (KV/R2) are unavailable locally on those machines.

---

## 8. Environment variables

Most secrets are stored as **Wrangler secrets** (`wrangler secret put`) for the Cloudflare Workers deployment; only a few live in `.env.local` / `wrangler.jsonc`. See `.env.example` for the full list.

| Variable | Where | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` / Cloudflare env | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` / Cloudflare env | yes | Public anon key (browser-safe) |
| `MIDTRANS_SERVER_KEY` | Wrangler secret | yes | Midtrans server key (never expose to browser) |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | `next.config.ts` (hardcoded) | yes | Midtrans client key |
| `MIDTRANS_IS_PRODUCTION` | `wrangler.jsonc` vars | yes | `"true"` for production Midtrans |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | `next.config.ts` (hardcoded) | yes | Same, baked into bundle |
| `RESEND_API_KEY` | Wrangler secret | yes | Resend API key for email delivery |
| `RESEND_FROM` | `wrangler.jsonc` vars | yes | Verified sender address, e.g. `orders@yourdomain.com` |
| `WHATSAPP_API_TOKEN` | Wrangler secret | no | Meta Cloud API system-user token |
| `WHATSAPP_API_PHONE_NUMBER_ID` | `.env.local` / Cloudflare env | no | Meta sender phone number ID |
| `WHATSAPP_API_NOTIFY_NUMBER` | `.env.local` / Cloudflare env | no | Store owner's number for order notifications |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | `.env.local` / Cloudflare env | no | Arbitrary secret for Meta webhook verification |
| `NEXT_PUBLIC_STORE_WHATSAPP_NUMBER` | `.env.local` / Cloudflare env | no | Fallback checkout number if store_settings is empty |

> `NEXT_PUBLIC_*` vars must be **hardcoded in `next.config.ts`** for Cloudflare Builds — `process.env.X` inside the env block resolves to `""` at build time.

---

## 9. Deployment (Cloudflare Workers)

```bash
# Preview locally with Cloudflare bindings
npm run preview

# Deploy to production
npm run deploy
# or push to master — Cloudflare Builds auto-deploys
```

1. Connect the GitHub repo to **Cloudflare Builds** and set build command `npm run build`.
2. Add environment variables in the Cloudflare dashboard (Supabase, Midtrans public keys, WhatsApp, Resend from address).
3. Add secrets via Wrangler (`wrangler secret put MIDTRANS_SERVER_KEY`, etc.).
4. Register the Midtrans webhook URL in the Midtrans dashboard: `https://your-domain.com/api/midtrans/webhook`.
5. (Optional) Register the Meta WhatsApp webhook: `https://your-domain.com/api/webhook/whatsapp`.

---

## 10. Portfolio notes

- **Problem framing:** turns an existing informal sales channel (WhatsApp) into a structured, shareable catalog without forcing merchants to change how they transact. Midtrans is layered on top as an optional online-payment path.
- **Engineering highlights:** SECURITY DEFINER RPCs as the boundary between anon/RLS and privileged writes; atomic stock check-and-decrement trigger prevents overselling under concurrent load; `settle_payment` provides idempotent payment + stock reconciliation so webhook and poller can race safely; adapted to Next.js 16 breaking conventions (`proxy.ts` → `middleware.ts`, async params/cookies).
- **Deliberate scoping:** singleton store settings, admin=authenticated. Customers can register for an account or check out as guests. Each design decision is documented in `PROGRESS.md` with a clear upgrade path.
