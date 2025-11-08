-- Add delivery_enabled setting to site_settings table
-- This allows admin to toggle delivery service on/off from the dashboard

INSERT INTO site_settings (id, value, type, description)
VALUES (
  'delivery_enabled',
  'true',
  'boolean',
  'Enable or disable delivery service option for customers'
)
ON CONFLICT (id) DO NOTHING;

