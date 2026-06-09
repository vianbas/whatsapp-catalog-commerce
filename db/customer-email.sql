-- Add optional customer_email to orders for email notifications.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
