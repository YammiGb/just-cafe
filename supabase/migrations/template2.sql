/*
  # Create Menu Management System

  1. New Tables
    - `menu_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `base_price` (decimal)
      - `category` (text)
      - `popular` (boolean)
      - `image_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `variations`
      - `id` (uuid, primary key)
      - `menu_item_id` (uuid, foreign key)
      - `name` (text)
      - `price` (decimal)
      - `created_at` (timestamp)
    
    - `add_ons`
      - `id` (uuid, primary key)
      - `menu_item_id` (uuid, foreign key)
      - `name` (text)
      - `price` (decimal)
      - `category` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for authenticated admin access
*/

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  base_price decimal(10,2) NOT NULL,
  category text NOT NULL,
  popular boolean DEFAULT false,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create variations table
CREATE TABLE IF NOT EXISTS variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create add_ons table
CREATE TABLE IF NOT EXISTS add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read menu items"
  ON menu_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read variations"
  ON variations
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read add-ons"
  ON add_ons
  FOR SELECT
  TO public
  USING (true);

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can manage menu items"
  ON menu_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage variations"
  ON variations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage add-ons"
  ON add_ons
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for menu_items
CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

/*
  # Add availability field to menu items

  1. Changes
    - Add `available` boolean field to menu_items table
    - Set default value to true for existing items
    - Update trigger function to handle the new field

  2. Security
    - No changes to existing RLS policies needed
*/

-- Add availability field to menu_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'available'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN available boolean DEFAULT true;
  END IF;
END $$;

/*
  # Create storage bucket for menu item images

  1. Storage Setup
    - Create 'menu-images' bucket for storing menu item images
    - Set bucket to be publicly accessible for reading
    - Allow authenticated users to upload images

  2. Security
    - Public read access for menu images
    - Authenticated upload access only
    - File size and type restrictions via policies
*/

-- Create storage bucket for menu images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Allow public read access to menu images
CREATE POLICY "Public read access for menu images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menu-images');

-- Allow authenticated users to upload menu images
CREATE POLICY "Authenticated users can upload menu images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Allow authenticated users to update menu images
CREATE POLICY "Authenticated users can update menu images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'menu-images');

-- Allow authenticated users to delete menu images
CREATE POLICY "Authenticated users can delete menu images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'menu-images');

/*
  # Create Categories Management System

  1. New Tables
    - `categories`
      - `id` (text, primary key) - kebab-case identifier
      - `name` (text) - display name
      - `icon` (text) - emoji or icon
      - `sort_order` (integer) - for ordering categories
      - `active` (boolean) - whether category is active
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on categories table
    - Add policies for public read access
    - Add policies for authenticated admin access

  3. Data Migration
    - Insert existing categories from the current hardcoded list
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '☕',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO public
  USING (active = true);

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger for categories
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert existing categories
INSERT INTO categories (id, name, icon, sort_order, active) VALUES
  ('hot-coffee', 'Hot Coffee', '☕', 1, true),
  ('iced-coffee', 'Iced Coffee', '🧊', 2, true),
  ('non-coffee', 'Non-Coffee', '🫖', 3, true),
  ('food', 'Food & Pastries', '🥐', 4, true)
ON CONFLICT (id) DO NOTHING;

-- Add foreign key constraint to menu_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'menu_items_category_fkey'
  ) THEN
    ALTER TABLE menu_items 
    ADD CONSTRAINT menu_items_category_fkey 
    FOREIGN KEY (category) REFERENCES categories(id);
  END IF;
END $$;

/*
  # Create Payment Methods Management System

  1. New Tables
    - `payment_methods`
      - `id` (text, primary key) - method identifier (gcash, maya, bank-transfer)
      - `name` (text) - display name
      - `account_number` (text) - phone number or account number
      - `account_name` (text) - account holder name
      - `qr_code_url` (text) - QR code image URL
      - `active` (boolean) - whether method is active
      - `sort_order` (integer) - display order
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on payment_methods table
    - Add policies for public read access
    - Add policies for authenticated admin access

  3. Initial Data
    - Insert default payment methods
*/

-- Create payment_methods table
CREATE TABLE IF NOT EXISTS payment_methods (
  id text PRIMARY KEY,
  name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  qr_code_url text NOT NULL,
  active boolean DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read active payment methods"
  ON payment_methods
  FOR SELECT
  TO public
  USING (active = true);

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can manage payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger for payment_methods
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default payment methods
INSERT INTO payment_methods (id, name, account_number, account_name, qr_code_url, sort_order, active) VALUES
  ('gcash', 'GCash', '09XX XXX XXXX', 'M&C Bakehouse', 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', 1, true),
  ('maya', 'Maya (PayMaya)', '09XX XXX XXXX', 'M&C Bakehouse', 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', 2, true),
  ('bank-transfer', 'Bank Transfer', 'Account: 1234-5678-9012', 'M&C Bakehouse', 'https://images.pexels.com/photos/8867482/pexels-photo-8867482.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', 3, true)
ON CONFLICT (id) DO NOTHING;


-- Public can READ files in this bucket
create policy "public read menu-images"
on storage.objects
for select
to public
using (bucket_id = 'menu-images');

-- Public can UPLOAD to this bucket
create policy "public upload menu-images"
on storage.objects
for insert
to public
with check (bucket_id = 'menu-images');

/*
  # Add Discount Pricing and Site Settings

  1. Menu Items Changes
    - Add `discount_price` (decimal, optional) - discounted price
    - Add `discount_start_date` (timestamp, optional) - when discount starts
    - Add `discount_end_date` (timestamp, optional) - when discount ends
    - Add `discount_active` (boolean) - whether discount is currently active

  2. New Tables
    - `site_settings`
      - `id` (text, primary key) - setting key
      - `value` (text) - setting value
      - `type` (text) - setting type (text, image, boolean, number)
      - `description` (text) - setting description
      - `updated_at` (timestamp)

  3. Security
    - Enable RLS on site_settings table
    - Add policies for public read access
    - Add policies for authenticated admin access
*/

-- Add discount pricing fields to menu_items table
DO $$
BEGIN
  -- Add discount_price column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'discount_price'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN discount_price decimal(10,2);
  END IF;

  -- Add discount_start_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'discount_start_date'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN discount_start_date timestamptz;
  END IF;

  -- Add discount_end_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'discount_end_date'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN discount_end_date timestamptz;
  END IF;

  -- Add discount_active column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'discount_active'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN discount_active boolean DEFAULT false;
  END IF;
END $$;

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id text PRIMARY KEY,
  value text NOT NULL,
  type text NOT NULL DEFAULT 'text',
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Anyone can read site settings"
  ON site_settings
  FOR SELECT
  TO public
  USING (true);

-- Create policies for authenticated admin access
CREATE POLICY "Authenticated users can manage site settings"
  ON site_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger for site_settings
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default site settings
INSERT INTO site_settings (id, value, type, description) VALUES
  ('site_name', 'Beracah Cafe', 'text', 'The name of the cafe/restaurant'),
  ('site_logo', 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', 'image', 'The logo image URL for the site'),
  ('site_description', 'Welcome to Beracah Cafe - Your perfect coffee destination', 'text', 'Short description of the cafe'),
  ('currency', 'PHP', 'text', 'Currency symbol for prices'),
  ('currency_code', 'PHP', 'text', 'Currency code for payments')
ON CONFLICT (id) DO NOTHING;

-- Create function to check if discount is active
CREATE OR REPLACE FUNCTION is_discount_active(
  discount_active boolean,
  discount_start_date timestamptz,
  discount_end_date timestamptz
)
RETURNS boolean AS $$
BEGIN
  -- If discount is not active, return false
  IF NOT discount_active THEN
    RETURN false;
  END IF;
  
  -- If no dates are set, return the discount_active value
  IF discount_start_date IS NULL AND discount_end_date IS NULL THEN
    RETURN discount_active;
  END IF;
  
  -- Check if current time is within the discount period
  RETURN (
    (discount_start_date IS NULL OR now() >= discount_start_date) AND
    (discount_end_date IS NULL OR now() <= discount_end_date)
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get effective price (discounted or regular)
CREATE OR REPLACE FUNCTION get_effective_price(
  base_price decimal,
  discount_price decimal,
  discount_active boolean,
  discount_start_date timestamptz,
  discount_end_date timestamptz
)
RETURNS decimal AS $$
BEGIN
  -- If discount is active and within date range, return discount price
  IF is_discount_active(discount_active, discount_start_date, discount_end_date) AND discount_price IS NOT NULL THEN
    RETURN discount_price;
  END IF;
  
  -- Otherwise return base price
  RETURN base_price;
END;
$$ LANGUAGE plpgsql;

-- Add computed columns for effective pricing (if supported by your Supabase version)
-- Note: These are comments as computed columns might not be available in all Supabase versions
-- You can implement this logic in your application instead

-- Create index for better performance on discount queries
CREATE INDEX IF NOT EXISTS idx_menu_items_discount_active ON menu_items(discount_active);
CREATE INDEX IF NOT EXISTS idx_menu_items_discount_dates ON menu_items(discount_start_date, discount_end_date);




/*
  Orders and Order Items

  - orders: stores customer/order-level info
  - order_items: line items linked to orders
  - RLS enabled with permissive policies for public insert/select (adjust as needed)
*/

-- Enable required extension for UUID if not already
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  contact_number text NOT NULL,
  service_type text NOT NULL CHECK (service_type IN ('dine-in','pickup','delivery')),
  address text,
  pickup_time text,
  party_size integer,
  dine_in_time timestamptz,
  payment_method text NOT NULL,
  reference_number text,
  notes text,
  total numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  name text NOT NULL,
  variation jsonb,
  add_ons jsonb,
  unit_price numeric(12,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policies (adjust to your security model)
-- Allow anyone to insert an order
CREATE POLICY "Public can insert orders"
  ON orders FOR INSERT TO public WITH CHECK (true);

-- Allow anyone to view orders (consider restricting to authenticated/admin later)
CREATE POLICY "Public can select orders"
  ON orders FOR SELECT TO public USING (true);

-- Allow anyone to insert order items
CREATE POLICY "Public can insert order items"
  ON order_items FOR INSERT TO public WITH CHECK (true);

-- Allow anyone to view order items
CREATE POLICY "Public can select order items"
  ON order_items FOR SELECT TO public USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Add ip_address to orders and a trigger to prevent spam orders per IP (1 minute)

-- Add column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE orders ADD COLUMN ip_address text;
  END IF;
END $$;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_ip_created_at ON orders(ip_address, created_at DESC);

-- Create or replace function to enforce 1-minute cooldown per IP
CREATE OR REPLACE FUNCTION prevent_spam_orders_per_ip()
RETURNS trigger AS $$
DECLARE
  recent_count int;
BEGIN
  IF NEW.ip_address IS NULL OR length(trim(NEW.ip_address)) = 0 THEN
    -- If IP is missing, allow but you may choose to block instead
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO recent_count
  FROM orders
  WHERE ip_address = NEW.ip_address
    AND created_at >= (now() - interval '60 seconds');

  IF recent_count > 0 THEN
    RAISE EXCEPTION 'Rate limit: Please wait 60 seconds before placing another order.' USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_prevent_spam_orders_per_ip ON orders;
CREATE TRIGGER trg_prevent_spam_orders_per_ip
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION prevent_spam_orders_per_ip();



-- Populate orders.ip_address from PostgREST forwarded headers when not provided

-- Function to extract IP from request headers
CREATE OR REPLACE FUNCTION set_order_ip_from_headers()
RETURNS trigger AS $$
DECLARE
  headers jsonb;
  fwd text;
  realip text;
  chosen text;
BEGIN
  IF NEW.ip_address IS NOT NULL AND length(trim(NEW.ip_address)) > 0 THEN
    RETURN NEW;
  END IF;

  -- PostgREST exposes request headers via current_setting('request.headers', true)
  BEGIN
    headers := current_setting('request.headers', true)::jsonb;
  EXCEPTION WHEN others THEN
    headers := '{}'::jsonb;
  END;

  fwd := COALESCE(headers->>'x-forwarded-for', headers->>'x-real-ip');
  IF fwd IS NOT NULL AND length(trim(fwd)) > 0 THEN
    -- x-forwarded-for may be a comma-separated list; take the first
    chosen := split_part(fwd, ',', 1);
  END IF;

  IF chosen IS NULL OR length(trim(chosen)) = 0 THEN
    realip := headers->>'x-real-ip';
    chosen := realip;
  END IF;

  IF chosen IS NOT NULL AND length(trim(chosen)) > 0 THEN
    NEW.ip_address := trim(chosen);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure we set IP before enforcing rate limit (trigger order matters)
DROP TRIGGER IF EXISTS trg_prevent_spam_orders_per_ip ON orders;
DROP TRIGGER IF EXISTS trg_set_order_ip_from_headers ON orders;

CREATE TRIGGER trg_set_order_ip_from_headers
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_ip_from_headers();

CREATE TRIGGER trg_prevent_spam_orders_per_ip
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION prevent_spam_orders_per_ip();

/*
  Add inventory fields and automatic availability management for menu items.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'track_inventory'
  ) THEN
    ALTER TABLE menu_items
      ADD COLUMN track_inventory boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'stock_quantity'
  ) THEN
    ALTER TABLE menu_items
      ADD COLUMN stock_quantity integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'low_stock_threshold'
  ) THEN
    ALTER TABLE menu_items
      ADD COLUMN low_stock_threshold integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Ensure non-negative stock values
ALTER TABLE menu_items
  ADD CONSTRAINT menu_items_stock_quantity_non_negative
  CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

ALTER TABLE menu_items
  ADD CONSTRAINT menu_items_low_stock_threshold_non_negative
  CHECK (low_stock_threshold >= 0);

-- Keep availability in sync when tracking inventory
CREATE OR REPLACE FUNCTION sync_menu_item_availability()
RETURNS trigger AS $$
BEGIN
  IF COALESCE(NEW.track_inventory, false) THEN
    NEW.stock_quantity := GREATEST(COALESCE(NEW.stock_quantity, 0), 0);
    NEW.low_stock_threshold := GREATEST(COALESCE(NEW.low_stock_threshold, 0), 0);

    IF NEW.stock_quantity <= NEW.low_stock_threshold THEN
      NEW.available := false;
    ELSE
      NEW.available := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_menu_item_availability ON menu_items;
CREATE TRIGGER trg_sync_menu_item_availability
BEFORE INSERT OR UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION sync_menu_item_availability();

-- Helper to decrement stock quantities in batch
CREATE OR REPLACE FUNCTION decrement_menu_item_stock(items jsonb)
RETURNS void AS $$
DECLARE
  entry jsonb;
  qty integer;
BEGIN
  IF items IS NULL THEN
    RETURN;
  END IF;

  FOR entry IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    qty := GREATEST(COALESCE((entry->>'quantity')::integer, 0), 0);

    IF qty <= 0 THEN
      CONTINUE;
    END IF;

    UPDATE menu_items
    SET stock_quantity = GREATEST(COALESCE(stock_quantity, 0) - qty, 0)
    WHERE track_inventory = true
      AND id::text = entry->>'id';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION decrement_menu_item_stock(jsonb) TO anon, authenticated;

/*
  Add receipt_url column to orders table for storing uploaded receipt image URLs
*/

-- Add receipt_url column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_url text;

-- Add index for faster lookups if needed
CREATE INDEX IF NOT EXISTS idx_orders_receipt_url ON orders(receipt_url) WHERE receipt_url IS NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN orders.receipt_url IS 'URL of the payment receipt image uploaded to Cloudinary';

DROP TRIGGER IF EXISTS trg_sync_menu_item_availability ON menu_items;

CREATE OR REPLACE FUNCTION sync_menu_item_availability()
RETURNS trigger AS $$
BEGIN
  IF COALESCE(NEW.track_inventory, false) THEN
    NEW.stock_quantity := GREATEST(COALESCE(NEW.stock_quantity, 0), 0);
    NEW.low_stock_threshold := GREATEST(COALESCE(NEW.low_stock_threshold, 0), 0);

    IF OLD.stock_quantity IS DISTINCT FROM NEW.stock_quantity OR 
       OLD.low_stock_threshold IS DISTINCT FROM NEW.low_stock_threshold OR
       OLD.track_inventory IS DISTINCT FROM NEW.track_inventory THEN
      
      IF NEW.stock_quantity <= NEW.low_stock_threshold THEN
        NEW.available := false;
      ELSE
        NEW.available := true;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_menu_item_availability
BEFORE INSERT OR UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION sync_menu_item_availability();




