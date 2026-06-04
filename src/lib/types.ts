/**
 * Shared domain types that mirror the PostgreSQL schema in `db/schema.sql`.
 *
 * These describe the *shape of rows returned by Supabase*. Input validation
 * (create/update payloads) lives in `src/lib/validations/*` as Zod schemas so
 * the two concerns stay decoupled: the DB can return columns we never let the
 * user edit (e.g. `id`, `created_at`).
 */

export type StockStatus = "available" | "sold_out" | "preorder";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  images: string[];
  stock_status: StockStatus;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** A product joined with its (optional) category — handy for catalog views. */
export interface ProductWithCategory extends Product {
  category: Pick<Category, "id" | "name" | "slug"> | null;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  store_description: string | null;
  whatsapp_number: string;
  currency: string;
  checkout_message_template: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: "admin" | "staff";
  created_at: string;
}

export type OrderStatus = "new" | "contacted" | "completed" | "cancelled";

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  source: string | null;
  status: OrderStatus;
  created_at: string;
}
