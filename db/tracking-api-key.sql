-- Seller provides their own Binderbyte API key to enable live expedition tracking
-- on /track and /orders/[id]. When null, those pages show only the static
-- courier name and resi number the admin entered.
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS tracking_api_key TEXT;
