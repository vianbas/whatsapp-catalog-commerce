-- Midtrans payment gateway columns on orders.
-- Run once in Supabase SQL editor. All columns are idempotent (IF NOT EXISTS).
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS midtrans_order_id TEXT,
  ADD COLUMN IF NOT EXISTS snap_token TEXT,
  ADD COLUMN IF NOT EXISTS payment_type TEXT;
