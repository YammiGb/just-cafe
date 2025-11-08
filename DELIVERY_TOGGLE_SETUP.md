# Delivery Toggle Feature - Setup Guide

## Overview
This feature allows the admin to enable or disable the delivery service option from the admin dashboard.

## What Changed

### 1. **Admin Dashboard - Site Settings**
- Added a new "Service Options" section with a delivery toggle switch
- Toggle shows as Green (Enabled) or Red (Disabled)
- Located in: Admin Dashboard → Site Settings

### 2. **Customer Checkout Page**
- Delivery button automatically hides when disabled by admin
- Shows a note: "Delivery service is currently unavailable"
- Grid automatically adjusts from 3 columns to 2 columns when delivery is hidden

### 3. **Database**
- New setting: `delivery_enabled` (default: `true`)
- Stored in `site_settings` table

## Setup Instructions

### Step 1: Run the Database Migration

You need to add the new setting to your Supabase database. Choose one of these methods:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste this SQL:

```sql
INSERT INTO site_settings (id, value, type, description)
VALUES (
  'delivery_enabled',
  'true',
  'boolean',
  'Enable or disable delivery service option for customers'
)
ON CONFLICT (id) DO NOTHING;
```

5. Click "Run" to execute the query

#### Option B: Using Supabase CLI
If you have Supabase CLI installed:

```bash
supabase db push
```

### Step 2: Test the Feature

1. **Test Admin Panel:**
   - Go to `/admin`
   - Navigate to "Site Settings"
   - Click "Edit Settings"
   - Toggle the "Delivery Service" switch
   - Click "Save Changes"

2. **Test Customer View:**
   - Go to the main site
   - Add items to cart
   - Go to checkout
   - You should see:
     - **If enabled:** 3 buttons (Dine In, Pickup, Delivery)
     - **If disabled:** 2 buttons (Dine In, Pickup) + message about delivery being unavailable

## How to Use

### For Your Client (Admin)

1. Login to Admin Dashboard at `/admin` with password: `JustCafe@Admin!2025`
2. Click "Site Settings" from the dashboard
3. Click "Edit Settings" button
4. Scroll down to "Service Options" section
5. Toggle the "Delivery Service" switch:
   - **Green = Enabled** (customers can select delivery)
   - **Gray = Disabled** (delivery option hidden from customers)
6. Click "Save Changes"

## Visual Guide

### Admin Dashboard - Delivery Toggle OFF:
```
┌────────────────────────────────────────────┐
│ Service Options                            │
├────────────────────────────────────────────┤
│ 🛵 Delivery Service           ⚪→ GRAY     │
│ Enable or disable delivery                 │
│ option for customers                       │
└────────────────────────────────────────────┘
```

### Admin Dashboard - Delivery Toggle ON:
```
┌────────────────────────────────────────────┐
│ Service Options                            │
├────────────────────────────────────────────┤
│ 🛵 Delivery Service           ⚪→ GREEN    │
│ Enable or disable delivery                 │
│ option for customers                       │
└────────────────────────────────────────────┘
```

### Customer Checkout - Delivery Disabled:
```
┌──────────────────────────────────────┐
│  🪑 Dine In      🚶 Pickup           │
│                                      │
│  ℹ️ Note: Delivery service is        │
│  currently unavailable               │
└──────────────────────────────────────┘
```

### Customer Checkout - Delivery Enabled:
```
┌──────────────────────────────────────┐
│  🪑 Dine In  🚶 Pickup  🛵 Delivery  │
│                                      │
│  📍 Note: Delivery orders require    │
│  a minimum purchase of ₱150          │
└──────────────────────────────────────┘
```

## Files Modified

1. `src/types/index.ts` - Added `delivery_enabled` to SiteSettings interface
2. `src/hooks/useSiteSettings.ts` - Added delivery_enabled to settings fetch
3. `src/components/SiteSettingsManager.tsx` - Added toggle UI
4. `src/components/Checkout.tsx` - Added conditional rendering for delivery option
5. `supabase/migrations/20250108000000_add_delivery_toggle.sql` - Database migration

## Troubleshooting

### Issue: Toggle doesn't save
- **Solution:** Make sure you clicked "Save Changes" button after toggling

### Issue: Delivery still shows on checkout even when disabled
- **Solution:** Refresh the checkout page (the setting is fetched when page loads)

### Issue: Migration error "already exists"
- **Solution:** The setting already exists in your database. This is fine, you can ignore this.

## Support

If you need any adjustments to this feature, please let me know!

