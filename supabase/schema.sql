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

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9_-]+$'),
  discount_type text not null check (discount_type in ('fixed', 'free_shipping')),
  discount_amount numeric not null default 0 check (discount_amount >= 0),
  min_quantity integer not null default 1 check (min_quantity > 0),
  is_active boolean not null default true
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
  coupon_code text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'printed', 'processing', 'shipped', 'delivered', 'cancelled')),
  stock_deducted boolean not null default false,
  courier_name text,
  courier_tracking_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table public.orders
  add column if not exists stock_deducted boolean not null default false;
alter table public.orders
  add column if not exists coupon_code text;

create or replace function public.place_order_with_stock(order_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  requested_bundle_id text := order_data->>'bundle_id';
  requested_quantity integer := (order_data->>'quantity')::integer;
  requested_coupon_code text := nullif(upper(btrim(order_data->>'coupon_code')), '');
  requested_item_subtotal numeric;
  requested_delivery_charge numeric;
  authoritative_unit_price numeric;
  bundle_has_free_delivery boolean;
  coupon_row public.coupons;
  calculated_discount numeric := 0;
  calculated_total numeric;
  order_row public.orders;
begin
  if requested_bundle_id is null or requested_quantity is null or requested_quantity < 1 then
    raise exception 'INVALID_ORDER_QUANTITY';
  end if;

  select sale_price, free_delivery
  into authoritative_unit_price, bundle_has_free_delivery
  from public.combos
  where id = requested_bundle_id;
  if found then
    requested_item_subtotal := authoritative_unit_price * requested_quantity;
  else
    select regular_price, false
    into authoritative_unit_price, bundle_has_free_delivery
    from public.products
    where id = requested_bundle_id;
    if not found then
      raise exception 'PRODUCT_NOT_FOUND';
    end if;
    requested_item_subtotal := authoritative_unit_price * requested_quantity;
  end if;
  if order_data->>'delivery_area' = 'dhaka' then
    requested_delivery_charge := case when bundle_has_free_delivery then 0 else 70 end;
  elsif order_data->>'delivery_area' = 'outside_dhaka' then
    requested_delivery_charge := case when bundle_has_free_delivery then 0 else 130 end;
  else
    raise exception 'INVALID_DELIVERY_AREA';
  end if;

  if requested_coupon_code is not null then
    select * into coupon_row
    from public.coupons
    where code = requested_coupon_code
      and is_active;
    if not found or requested_quantity < coupon_row.min_quantity then
      raise exception 'INVALID_COUPON';
    end if;

    if coupon_row.discount_type = 'fixed' then
      calculated_discount := least(coupon_row.discount_amount, requested_item_subtotal);
    elsif coupon_row.discount_type = 'free_shipping' then
      requested_delivery_charge := 0;
    end if;
  end if;
  calculated_total := greatest(
    0,
    requested_item_subtotal + requested_delivery_charge - calculated_discount
  );

  if exists (select 1 from public.combos where id = requested_bundle_id) then
    update public.combos
    set stock_count = stock_count - requested_quantity,
        in_stock = stock_count - requested_quantity > 0
    where id = requested_bundle_id
      and in_stock
      and stock_count >= requested_quantity;
    if not found then
      raise exception 'INSUFFICIENT_STOCK';
    end if;
  else
    update public.products
    set stock_quantity = stock_quantity - requested_quantity,
        in_stock = stock_quantity - requested_quantity > 0
    where id = requested_bundle_id
      and in_stock
      and stock_quantity >= requested_quantity;
    if not found then
      if exists (select 1 from public.products where id = requested_bundle_id) then
        raise exception 'INSUFFICIENT_STOCK';
      end if;
      raise exception 'PRODUCT_NOT_FOUND';
    end if;
  end if;

  insert into public.orders (
    id, order_id, customer_name, customer_phone, customer_address, delivery_area,
    note, payment_method, bkash_tx_id, bundle_id, bundle_name, quantity,
    item_subtotal, delivery_charge, discount, total_amount, coupon_code, status, created_at, stock_deducted
  ) values (
    order_data->>'id',
    order_data->>'order_id',
    order_data->>'customer_name',
    order_data->>'customer_phone',
    order_data->>'customer_address',
    order_data->>'delivery_area',
    coalesce(order_data->>'note', ''),
    order_data->>'payment_method',
    coalesce(order_data->>'bkash_tx_id', ''),
    requested_bundle_id,
    order_data->>'bundle_name',
    requested_quantity,
    requested_item_subtotal,
    requested_delivery_charge,
    calculated_discount,
    calculated_total,
    requested_coupon_code,
    'pending',
    coalesce((order_data->>'created_at')::timestamptz, now()),
    true
  )
  returning * into order_row;

  return to_jsonb(order_row);
end;
$$;

revoke all on function public.place_order_with_stock(jsonb) from public;
grant execute on function public.place_order_with_stock(jsonb) to anon, authenticated;

create or replace function public.sync_order_stock_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'cancelled' and old.status <> 'cancelled' and old.stock_deducted then
    if exists (select 1 from public.combos where id = old.bundle_id) then
      update public.combos
      set stock_count = stock_count + old.quantity,
          in_stock = true
      where id = old.bundle_id;
    elsif exists (select 1 from public.products where id = old.bundle_id) then
      update public.products
      set stock_quantity = stock_quantity + old.quantity,
          in_stock = true
      where id = old.bundle_id;
    else
      raise exception 'PRODUCT_NOT_FOUND';
    end if;
    new.stock_deducted := false;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' and not old.stock_deducted then
    if exists (select 1 from public.combos where id = old.bundle_id) then
      update public.combos
      set stock_count = stock_count - old.quantity,
          in_stock = stock_count - old.quantity > 0
      where id = old.bundle_id
        and in_stock
        and stock_count >= old.quantity;
    elsif exists (select 1 from public.products where id = old.bundle_id) then
      update public.products
      set stock_quantity = stock_quantity - old.quantity,
          in_stock = stock_quantity - old.quantity > 0
      where id = old.bundle_id
        and in_stock
        and stock_quantity >= old.quantity;
    else
      raise exception 'PRODUCT_NOT_FOUND';
    end if;
    if not found then
      raise exception 'INSUFFICIENT_STOCK';
    end if;
    new.stock_deducted := true;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.sync_order_stock_on_status_change() from public, anon, authenticated;
drop trigger if exists orders_sync_stock_on_status_change on public.orders;
create trigger orders_sync_stock_on_status_change
  before update of status on public.orders
  for each row
  execute function public.sync_order_stock_on_status_change();

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'confirmed', 'printed', 'processing', 'shipped', 'delivered', 'cancelled'));

alter table public.products enable row level security;
alter table public.combos enable row level security;
alter table public.coupons enable row level security;
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

drop policy if exists "Active coupons are public to read" on public.coupons;
create policy "Active coupons are public to read"
  on public.coupons for select to anon, authenticated using (is_active);
drop policy if exists "Admins manage coupons" on public.coupons;
create policy "Admins manage coupons"
  on public.coupons for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Customers can place pending orders" on public.orders;
drop policy if exists "Admins manage orders" on public.orders;
create policy "Admins manage orders"
  on public.orders for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

insert into public.coupons (code, discount_type, discount_amount, min_quantity, is_active)
values
  ('EID50', 'fixed', 50, 1, true),
  ('EID100', 'fixed', 100, 2, true),
  ('FREESHIP', 'free_shipping', 0, 1, true)
on conflict (code) do nothing;

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
