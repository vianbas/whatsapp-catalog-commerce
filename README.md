# WhatsApp Catalog Commerce

A lightweight product-catalog storefront where customers browse products and
**check out by sending a pre-filled order to the store's WhatsApp** — no payment
gateway, no customer accounts, no cart server. Built for small sellers in
markets (e.g. Indonesia) where WhatsApp *is* the sales channel.

---

## 1. Product summary

WhatsApp Catalog Commerce is a Next.js storefront + lightweight admin. Sellers
manage a catalog (products, categories, store settings) in a protected admin
area; shoppers browse a fast, mobile-first storefront and tap **"Order via
WhatsApp"**, which opens WhatsApp with an order summary already typed out. The
conversation — and the actual sale — continues in WhatsApp.

## 2. Business use case

Many small merchants already sell entirely through WhatsApp. They lose time
re-typing product details and prices into chats, and have no shareable,
always-up-to-date catalog. This project gives them:

- A public catalog link they can share in bios, statuses, and groups.
- Accurate, formatted prices (Indonesian Rupiah) and stock status.
- One-tap checkout that drops a clean order summary into their WhatsApp inbox.
- A simple admin to keep the catalog current.

No payment gateway or shipping integration is required — payment and logistics
are negotiated in chat, exactly as sellers already operate.

## 3. Feature roadmap

**Foundation (this step)**
- [x] Project structure, Supabase clients (browser/server), session proxy.
- [x] Database schema, RLS policies, and seed data.
- [x] Domain types + Zod validation (product / category / store settings).
- [x] Storefront: landing, product list with category filter, product detail.
- [x] WhatsApp checkout link builder + checkout page.
- [x] Admin shell: auth-gated layout, dashboard, products table, product form
      (validated), categories list, settings view.

**Next**
- [ ] Wire product/category create-update-delete via Server Actions.
- [ ] Persist store settings from the admin form.
- [ ] Multi-item cart → multi-line WhatsApp order.
- [ ] Role-based admin (use `profiles.role`) and stricter RLS.
- [ ] Image optimization, search, pagination.

## 4. Tech stack

| Area        | Choice                                             |
| ----------- | -------------------------------------------------- |
| Framework   | Next.js (App Router) + React 19                    |
| Language    | TypeScript (strict)                                |
| Styling     | Tailwind CSS v4, shadcn/ui (radix-vega), Radix UI  |
| Icons/Font  | Lucide, Inter                                      |
| Data        | Supabase PostgreSQL                                |
| Auth        | Supabase Auth (email/password)                     |
| Storage     | Supabase Storage (`product-images` bucket)         |
| Validation  | Zod + React Hook Form (`@hookform/resolvers`)      |
| Deployment  | Vercel                                             |

> **Note on Next.js version:** this project uses a Next.js release where the
> `middleware` convention is renamed to **`proxy`** (`src/proxy.ts`), and route
> `params`/`searchParams` and `cookies()` are **async**. See `AGENTS.md`.

## 5. Architecture / codegraph

```txt
.
├── db/
│   ├── schema.sql            # tables, enums, triggers
│   ├── rls.sql               # row-level security policies
│   └── seed.sql              # demo categories/products/settings
├── src/
│   ├── proxy.ts              # Next "middleware" → refresh session, gate /admin
│   ├── app/
│   │   ├── page.tsx          # landing
│   │   ├── login/            # admin sign-in (Supabase Auth)
│   │   ├── products/         # storefront list + [slug] detail
│   │   ├── checkout/         # WhatsApp order summary
│   │   └── admin/            # auth-gated: dashboard, products, categories, settings
│   ├── components/
│   │   ├── admin-sidebar.tsx
│   │   ├── category-filter.tsx
│   │   ├── image-uploader.tsx
│   │   ├── product-card.tsx
│   │   ├── product-form.tsx
│   │   ├── product-grid.tsx
│   │   ├── whatsapp-checkout-button.tsx
│   │   └── ui/               # shadcn/ui primitives
│   └── lib/
│       ├── types.ts          # DB row types
│       ├── slug.ts           # slugify + slug pattern
│       ├── utils.ts          # cn(), formatRupiah()
│       ├── whatsapp.ts       # number normalizer + wa.me link builder
│       ├── supabase/         # client.ts, server.ts, middleware.ts (helper)
│       └── validations/      # product.ts, category.ts, store-settings.ts (Zod)
```

**Data flow:** Server Components read the catalog via the Supabase *server*
client (anon key + RLS). The browser client is used only for auth (login/logout)
and Storage uploads. `src/proxy.ts` refreshes the session cookie on every
request and redirects unauthenticated users away from `/admin`.

## 6. Database schema overview

- **profiles** — one row per admin/staff user, FK to `auth.users`. Has a `role`
  column (`admin` | `staff`) for future role-based access.
- **categories** — `name`, unique `slug`, `is_active`, `sort_order`.
- **products** — `category_id` (nullable FK), `name`, unique `slug`,
  `description`, `price` and `compare_at_price` (whole Rupiah, integers),
  `images` (`text[]`), `stock_status` (`available|sold_out|preorder`),
  `is_featured`, `is_active`, `sort_order`, timestamps.
- **store_settings** — singleton row (`store_name`, `whatsapp_number`,
  `currency`, `checkout_message_template`).

`updated_at` is maintained by a shared trigger. Apply files in order:
`schema.sql` → `rls.sql` → `seed.sql`.

## 7. Security notes

- **Service-role key is never used in app code.** Both the browser and server
  Supabase clients use only `NEXT_PUBLIC_SUPABASE_ANON_KEY`. RLS is the security
  boundary.
- **RLS is enabled on every app table.** Public users can read only *active*
  products/categories and store settings; any authenticated user may currently
  manage catalog data.
- **Simplification (documented):** "authenticated == admin" is intentional for
  this step. `db/rls.sql` documents exactly how to tighten this to a
  `profiles.role = 'admin'` check with no schema change.
- **Route protection:** `src/proxy.ts` blocks unauthenticated access to
  `/admin`; the admin layout re-checks `getUser()` as defense in depth.
- Never commit real secrets. `.env*` is git-ignored (except `.env.example`).

## 8. Local development setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local   # then fill in your Supabase values

# 3. Apply the database (Supabase SQL editor or psql), in order:
#    db/schema.sql → db/rls.sql → db/seed.sql

# 4. Create the Storage bucket `product-images` (public) in Supabase.

# 5. Create an admin user in Supabase Auth, then run:
npm run dev
```

Visit `http://localhost:3000` for the storefront and `/admin` for the admin
(sign in at `/login`).

## 9. Environment variables

| Variable                            | Required | Description                                   |
| ----------------------------------- | -------- | --------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`          | yes      | Supabase project URL.                         |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | yes      | Public anon key (browser-safe).               |
| `NEXT_PUBLIC_STORE_WHATSAPP_NUMBER` | no       | Fallback WhatsApp number for checkout links.  |

## 10. Deployment plan

1. Push the repository to GitHub and import it into **Vercel**.
2. Add the three environment variables in the Vercel project settings.
3. Ensure the Supabase schema/RLS/seed have been applied and the
   `product-images` bucket exists and is public.
4. Deploy. Next.js auto-detects the App Router; `src/proxy.ts` runs at the edge
   to keep sessions fresh.

## 11. Portfolio case study notes

- **Problem framing:** turns an existing informal sales channel (WhatsApp) into
  a structured, shareable catalog without forcing merchants to change how they
  transact.
- **Engineering highlights:** strict TypeScript end-to-end; Zod schemas shared
  between form validation and (future) server mutations; RLS-first security with
  no service-role key in app code; clean separation of browser vs. server
  Supabase clients; adapted to a Next.js version with breaking changes
  (`proxy.ts`, async `params`/`cookies`).
- **Deliberate scoping:** no payment/shipping/multi-tenant — the WhatsApp
  handoff is the product, and the simplifications (singleton settings,
  authenticated==admin) are documented with a clear upgrade path.
