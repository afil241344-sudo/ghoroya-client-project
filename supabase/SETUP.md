# Supabase setup

1. In Supabase SQL Editor, run [`schema.sql`](./schema.sql). It creates the products, combos, coupons, store delivery settings, slider images, and orders tables, the public `catalog` image bucket, RLS policies, realtime order updates, the atomic stock-aware order RPC, server-validated coupon discounts and delivery charges, and automatic stock restoration when an order is cancelled. It does not seed products, combos, or slider images; add them from the admin dashboard. When updating an existing deployment, run it again to apply schema changes. Existing database records are not deleted by the schema.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the deployment environment. The browser must only receive the publishable key; never put a secret/service-role key in a `VITE_*` variable.
3. In Supabase Auth, create the admin user. In SQL Editor, assign its trusted app metadata:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'admin@example.com';
   ```

   Replace the example email and sign in again after changing the role. Do not grant the admin role through user-editable metadata.
4. For a one-time migration, put a **newly rotated** Supabase secret key in `.env.local` as `SUPABASE_SECRET_KEY`. Keep it out of browser variables and source control. Then run `npm run migrate:firebase`. The migration reads Firebase `products`, `combos`, and `orders`; catalog image URLs are copied into Supabase Storage. It is safe to rerun: rows and image paths are upserted.

The migration command requires the existing `firebase-applet-config.json` and readable Firestore collections. Configure Dhaka and outside-Dhaka delivery fees from the admin dashboard's Settings tab; no application-code change is needed when rates change. Manage hero slides from the Slider tab; images must be 16:9, at least 1280 × 720 px, and no larger than 5 MB (1920 × 1080 px is recommended). If the backend has no active slides, the storefront omits the slider rather than showing bundled defaults. If there are no products or combos, the storefront shows a clear empty state and prevents empty orders. Orders remain private to admins; customers can create pending orders only through the stock-aware RPC.
