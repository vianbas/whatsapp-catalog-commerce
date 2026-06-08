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

### 1. Admin WhatsApp notification on order status change
When admin changes an order's status, fire a WhatsApp text to `orders.customer_phone` if it exists.
- Add `sendStatusNotification(phone, status)` to `src/lib/whatsapp-api.ts`
- Call fire-and-forget from `src/app/admin/orders/actions.ts` after status update
- Silent no-op if `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN` not set

### 2. Low-stock alert banner (admin, in-app only)
Amber warning banner in admin when products are running low.
- `/admin/products` list: banner listing products where `stock_quantity <= 5` and `stock_status != sold_out`
- Product edit page: same inline alert on the specific product
- Tailwind: `bg-amber-50 border border-amber-200 text-amber-800`

### 3. CSV bulk product import
Admin page to upload a CSV and bulk-create products.
- New page: `/admin/products/import`
- Client: FileReader + manual CSV parse (no library), preview table, import button
- Server action: slugify name → look up category_id by slug → insert products
- Expected CSV columns: `name, price, description, stock_quantity, category_slug`
- Add "Import CSV" link next to "New product" on the products list

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
