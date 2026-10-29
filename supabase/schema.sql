create table if not exists public.products (
  id text primary key,
  name text not null,
  sku text not null default '',
  category text not null,
  unit_weight text not null default '',
  cost_price numeric not null default 0,
  regular_price numeric not null default 0,
  stock_quantity integer not null default 0,
  in_stock boolean not null default true,
  description text not null default '',
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.combos (
  id text primary key,
  name text not null,
  subtitle text not null default '',
  weight text not null default '',
  boxes integer not null default 1,
  original_price numeric not null default 0,
  sale_price numeric not null default 0,
  savings numeric not null default 0,
  badge text,
  badge_color text,
  free_delivery boolean not null default false,
  popular boolean not null default false,
  description text not null default '',
  in_stock boolean not null default true,
  stock_count integer not null default 0,
  included_product_ids text,
  image_url text
);

create table if not exists public.orders (
  id text primary key,
  order_id text not null unique,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  delivery_area text not null check (delivery_area in ('dhaka', 'outside_dhaka')),
  note text not null default '',
  payment_method text not null check (payment_method in ('cod', 'bkash')),
  bkash_tx_id text not null default '',
  bundle_id text not null,
  bundle_name text not null,
  quantity integer not null check (quantity > 0),
  item_subtotal numeric not null,
  delivery_charge numeric not null default 0,
  discount numeric not null default 0,
  total_amount numeric not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'printed', 'processing', 'shipped', 'delivered', 'cancelled')),
  courier_name text,
  courier_tracking_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'confirmed', 'printed', 'processing', 'shipped', 'delivered', 'cancelled'));

alter table public.products enable row level security;
alter table public.combos enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Catalog is public to read" on public.products;
create policy "Catalog is public to read"
  on public.products for select to anon, authenticated using (true);
drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
  on public.products for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Combos are public to read" on public.combos;
create policy "Combos are public to read"
  on public.combos for select to anon, authenticated using (true);
drop policy if exists "Admins manage combos" on public.combos;
create policy "Admins manage combos"
  on public.combos for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Customers can place pending orders" on public.orders;
create policy "Customers can place pending orders"
  on public.orders for insert to anon, authenticated
  with check (status = 'pending');
drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders"
  on public.orders for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into public.products (
  id, name, sku, category, unit_weight, cost_price, regular_price,
  stock_quantity, in_stock, description
) values
  ('prod-shemai-450', 'শাহী গাওয়া ঘিয়ে ভাজা লাচ্ছা সেমাই (৪৫০ গ্রাম বক্স)', 'LCH-SHM-450',
   'লাচ্ছা সেমাই', '৪৫০ গ্রাম', 280, 420, 280, true,
   'সিরাজগঞ্জের খাঁটি গাওয়া ঘিয়ে ভাজা প্রিমিয়াম মুচমুচে সোনালী সেমাই। কোনো ডালডা নেই।'),
  ('prod-ghee-250', 'সিরাজগঞ্জের খাঁটি গাওয়া ঘি জার (২৫০ গ্রাম)', 'GHEE-JAR-250',
   'গাওয়া ঘি', '২৫০ গ্রাম', 320, 480, 95, true,
   'দেশি গাভীর খাঁটি দুধের সর থেকে ঐতিহ্যবাহী নিয়মে প্রস্তুতকৃত সুঘ্রাণযুক্ত গাওয়া ঘি।'),
  ('prod-topping-nuts', 'স্পেশাল পেস্তা, কাঠবাদাম ও জাফরান টপিং (১০০ গ্রাম)', 'TOP-NUT-100',
   'টপিং ও বাদাম', '১০০ গ্রাম', 150, 240, 140, true,
   'আসল ইরানি জাফরান, পেস্তা ও কাঠবাদাম স্লাইসের রাজকীয় ব্লেন্ড যা সেমাইয়ের স্বাদ দ্বিগুণ করে।'),
  ('prod-kismis-gold', 'প্রিমিয়াম গোল্ডেন কিশমিশ প্যাক (১৫০ গ্রাম)', 'KSM-GLD-150',
   'ড্রাই ফ্রুটস', '১৫০ গ্রাম', 110, 180, 110, true,
   'স্বাদ ও আকারে বড় মিষ্টি বাছাইকৃত গোল্ডেন কিশমিশ।')
on conflict (id) do nothing;

insert into public.combos (
  id, name, subtitle, weight, boxes, original_price, sale_price, savings, badge,
  badge_color, free_delivery, popular, description, in_stock, stock_count, included_product_ids
) values
  ('bundle-single', '১ বক্স ট্রায়াল প্যাক', 'টেস্ট ও ব্যক্তিগত ব্যবহারের জন্য আদর্শ',
   '৪৫০ গ্রাম (১ বক্স)', 1, 550, 420, 130, 'জনপ্রিয় ট্রায়াল', 'bg-amber-600',
   false, false, 'খাঁটি গাওয়া ঘি, প্রিমিয়াম জাফরান ফ্লেভার এবং মুচমুচে সুস্বাদু কারিগরি তৈরি।',
   true, 120, 'prod-shemai-450 (1x)'),
  ('bundle-double', '২ বক্স ফ্যামিলি সেভার প্যাক', 'সবচেয়ে বেশি বিক্রিত এবং পরিবারের পছন্দের প্যাক',
   '৯০০ গ্রাম (২ বক্স)', 2, 1100, 790, 310, 'সেরা অফার (Best Choice)', 'bg-emerald-700',
   false, true, 'পরিবারের সবার সাথে আনন্দ ভাগ করে নিতে সবচেয়ে জনপ্রিয় কম্বো। সেভ হবে ৩১০ টাকা!',
   true, 85, 'prod-shemai-450 (2x)'),
  ('bundle-family', '৪ বক্স গ্র্যান্ড উৎসব ধামাকা প্যাক', 'সম্পূর্ণ ফ্রি ডেলিভারি + উপহার বক্স',
   '১৮০০ গ্রাম (৪ বক্স)', 4, 2200, 1490, 710, 'ফ্রি ডেলিভারি + মেগা সেভিংস', 'bg-rose-700',
   true, false, 'আত্মীয়-স্বজন ও মেহমানদারির জন্য উপযুক্ত। কোনো ডেলিভারি চার্জ লাগবে না!',
   true, 40, 'prod-shemai-450 (4x)')
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog', 'catalog', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Catalog images are publicly readable" on storage.objects;
create policy "Catalog images are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'catalog');
drop policy if exists "Admins upload catalog images" on storage.objects;
create policy "Admins upload catalog images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'catalog'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
drop policy if exists "Admins update catalog images" on storage.objects;
create policy "Admins update catalog images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'catalog'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    bucket_id = 'catalog'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
drop policy if exists "Admins delete catalog images" on storage.objects;
create policy "Admins delete catalog images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'catalog'
    and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception
  when duplicate_object then null;
end
$$;

-- Create the admin user in Supabase Auth, then assign its trusted app metadata:
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where email = 'admin@example.com';
-- Sign out and back in after changing the role so the JWT is refreshed.
