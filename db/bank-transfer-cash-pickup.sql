-- Bank transfer & cash pickup payment methods
-- Apply AFTER schema.sql + rls.sql.
--
-- Adds seller-configurable payment method columns to store_settings and a
-- payment_proof_url column to orders for optional transfer receipt uploads.

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS bank_accounts   JSONB   NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cash_pickup_enabled BOOLEAN NOT NULL DEFAULT false;

-- bank_accounts stores an array of { bank, account_number, account_holder }.
-- Visible to checkout (anon read via store_settings SELECT policy) so buyers
-- can see where to transfer without any auth.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
