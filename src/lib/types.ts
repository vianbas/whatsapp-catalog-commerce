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
  stock_quantity: number | null;
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

export interface BankAccount {
  bank: string;
  account_number: string;
  account_holder: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  store_description: string | null;
  whatsapp_number: string;
  currency: string;
  checkout_message_template: string | null;
  bank_accounts: BankAccount[];
  cash_pickup_enabled: boolean;
  qris_merchant_string: string | null;
  tracking_api_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: "admin" | "staff" | "customer";
  created_at: string;
}

export type UserRole = Profile["role"];

/** Row returned by the admin-only `list_users()` SQL function. */
export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export type OrderStatus = "new" | "contacted" | "completed" | "cancelled";

export interface DiscountCode {
  id: string;
  code: string;
  type: "percent" | "flat";
  value: number;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  product_id?: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  body: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string | null;
  items: OrderItem[];
  total: number;
  source: string | null;
  status: OrderStatus;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  notes: string | null;
  payment_status: string;
  midtrans_order_id: string | null;
  snap_token: string | null;
  payment_type: string | null;
  customer_email: string | null;
  courier: string | null;
  tracking_number: string | null;
  stock_released: boolean;
  payment_proof_url: string | null;
  created_at: string;
}
