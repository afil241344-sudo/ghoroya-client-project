# Supabase setup

1. In Supabase SQL Editor, run [`schema.sql`](./schema.sql). It creates the products, combos, and orders tables, the public `catalog` image bucket, RLS policies, and realtime order updates.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the deployment environment. The browser must only receive the publishable key; never put a secret/service-role key in a `VITE_*` variable.
3. In Supabase Auth, create the admin user. In SQL Editor, assign its trusted app metadata:

   ```sql
   update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = 'admin@example.com';
   ```

   Replace the example email and sign in again after changing the role. Do not grant the admin role through user-editable metadata.
4. For a one-time migration, put a **newly rotated** Supabase secret key in `.env.local` as `SUPABASE_SECRET_KEY`. Keep it out of browser variables and source control. Then run `npm run migrate:firebase`. The migration reads Firebase `products`, `combos`, and `orders`; catalog image URLs are copied into Supabase Storage. It is safe to rerun: rows and image paths are upserted.

The migration command requires the existing `firebase-applet-config.json` and readable Firestore collections. Orders remain private to admins; anonymous visitors can only create pending orders.
