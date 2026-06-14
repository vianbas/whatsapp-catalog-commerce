-- QRIS: seller pastes their static merchant QRIS string from GoPay/OVO/DANA/etc.
-- The app converts it to a dynamic QR (EMV QCO spec) at checkout with the
-- exact transaction amount embedded and a recalculated CRC-16.
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS qris_merchant_string TEXT;
