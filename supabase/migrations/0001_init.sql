-- =============================================================================
-- BillBook — full database migration
-- Run this ONCE in Supabase → SQL Editor → New query → paste → Run.
--
-- Creates: tables, indexes, Row Level Security policies, the atomic
-- create_bill() function (safe bill numbering), the public bill reader,
-- the customer summary view, dashboard stats, and the "logos" storage bucket.
-- =============================================================================

-- pgcrypto gives us gen_random_bytes() for unguessable public tokens.
-- On Supabase, extensions live in the "extensions" schema.
create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- 1. TABLES
-- -----------------------------------------------------------------------------

-- One business per shop owner.
create table public.businesses (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null unique references auth.users (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 120),
  logo_url      text,
  address       text check (char_length(address) <= 300),
  phone         text check (char_length(phone) <= 20),
  footer_note   text check (char_length(footer_note) <= 300),
  -- Last bill number issued. Only create_bill() changes it.
  bill_counter  integer not null default 0,
  created_at    timestamptz not null default now()
);

-- Customers are identified by phone number, per business.
create table public.customers (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  -- Always stored as +947XXXXXXXX (Sri Lankan mobile, E.164).
  phone        text not null check (phone ~ '^\+947[0-9]{8}$'),
  name         text check (char_length(name) <= 120),
  created_at   timestamptz not null default now(),
  unique (business_id, phone)
);

create table public.bills (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses (id) on delete cascade,
  customer_id     uuid not null references public.customers (id) on delete restrict,
  bill_number     text not null,
  -- Random, unguessable token used in the public URL /b/<token>.
  public_token    text not null unique,
  subtotal        numeric(12,2) not null check (subtotal >= 0),
  -- Discount is always stored as an amount in Rs.
  discount        numeric(12,2) not null default 0 check (discount >= 0),
  -- What the user typed, so we can show "10% off" on the bill.
  discount_type   text check (discount_type in ('amount', 'percent')),
  discount_value  numeric(12,2),
  total           numeric(12,2) not null check (total >= 0),
  note            text check (char_length(note) <= 500),
  created_at      timestamptz not null default now(),
  unique (business_id, bill_number)
);

create table public.bill_items (
  id          uuid primary key default gen_random_uuid(),
  bill_id     uuid not null references public.bills (id) on delete cascade,
  position    smallint not null default 0,
  item_name   text not null check (char_length(item_name) between 1 and 200),
  quantity    numeric(10,3) not null check (quantity > 0),
  unit_price  numeric(12,2) not null check (unit_price >= 0),
  line_total  numeric(12,2) not null check (line_total >= 0)
);

-- -----------------------------------------------------------------------------
-- 2. INDEXES
-- -----------------------------------------------------------------------------
create index bills_business_created_idx on public.bills (business_id, created_at desc);
create index bills_customer_created_idx on public.bills (customer_id, created_at desc);
create index bill_items_bill_idx        on public.bill_items (bill_id);
create index customers_business_name_idx on public.customers (business_id, name);

-- -----------------------------------------------------------------------------
-- 3. HELPER: the current user's business id
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER so it can be used inside RLS policies without recursion.
create or replace function public.my_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.businesses where owner_id = auth.uid()
$$;

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.businesses enable row level security;
alter table public.customers  enable row level security;
alter table public.bills      enable row level security;
alter table public.bill_items enable row level security;

-- businesses: owner can read, create and edit their own row.
create policy "owner reads own business" on public.businesses
  for select to authenticated using (owner_id = auth.uid());
create policy "owner creates own business" on public.businesses
  for insert to authenticated with check (owner_id = auth.uid());
create policy "owner updates own business" on public.businesses
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- customers: full access to own business's customers.
create policy "owner manages own customers" on public.customers
  for all to authenticated
  using (business_id = public.my_business_id())
  with check (business_id = public.my_business_id());

-- bills: read + delete own. Inserts only happen through create_bill().
create policy "owner reads own bills" on public.bills
  for select to authenticated using (business_id = public.my_business_id());
create policy "owner deletes own bills" on public.bills
  for delete to authenticated using (business_id = public.my_business_id());

-- bill_items: read items of own bills. (Deleted together with the bill.)
create policy "owner reads own bill items" on public.bill_items
  for select to authenticated
  using (exists (
    select 1 from public.bills b
    where b.id = bill_items.bill_id and b.business_id = public.my_business_id()
  ));

-- -----------------------------------------------------------------------------
-- 5. TABLE PRIVILEGES (defence in depth on top of RLS)
-- -----------------------------------------------------------------------------
-- Anonymous visitors get nothing directly. They read a public bill only
-- through get_public_bill(token).
revoke all on public.businesses, public.customers, public.bills, public.bill_items from anon;

-- Owners may not set bill_counter themselves (prevents duplicate numbers).
revoke insert, update on public.businesses from authenticated;
grant insert (owner_id, name, logo_url, address, phone, footer_note) on public.businesses to authenticated;
grant update (name, logo_url, address, phone, footer_note)           on public.businesses to authenticated;

-- Bills and items are created only by create_bill() and never edited.
revoke insert, update on public.bills, public.bill_items from authenticated;

-- -----------------------------------------------------------------------------
-- 6. create_bill(): one transaction that numbers, saves and totals a bill
-- -----------------------------------------------------------------------------
-- p_items is a JSON array: [{"item_name":"Rice 5kg","quantity":2,"unit_price":1250}, ...]
-- Returns {"id": ..., "bill_number": "INV-0001", "public_token": "..."}
create or replace function public.create_bill(
  p_phone           text,
  p_customer_name   text,
  p_items           jsonb,
  p_discount_type   text    default null,
  p_discount_value  numeric default 0,
  p_note            text    default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_business_id  uuid;
  v_counter      integer;
  v_bill_number  text;
  v_customer_id  uuid;
  v_bill_id      uuid;
  v_token        text;
  v_item         jsonb;
  v_name         text;
  v_qty          numeric;
  v_price        numeric;
  v_position     integer := 0;
  v_subtotal     numeric(12,2) := 0;
  v_discount     numeric(12,2) := 0;
  v_total        numeric(12,2);
begin
  -- Who is calling? (auth.uid() comes from the user's JWT.)
  select b.id into v_business_id from public.businesses b where b.owner_id = auth.uid();
  if v_business_id is null then
    raise exception 'Please set up your business profile first.';
  end if;

  -- Validate input ---------------------------------------------------------
  if p_phone is null or p_phone !~ '^\+947[0-9]{8}$' then
    raise exception 'Invalid mobile number. Use 07XXXXXXXX.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one item.';
  end if;
  if jsonb_array_length(p_items) > 200 then
    raise exception 'Too many items on one bill (max 200).';
  end if;

  -- Compute subtotal on the server. Never trust totals sent by the browser.
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_name  := btrim(coalesce(v_item ->> 'item_name', ''));
    v_qty   := (v_item ->> 'quantity')::numeric;
    v_price := (v_item ->> 'unit_price')::numeric;
    if v_name = '' then raise exception 'Every item needs a name.'; end if;
    if v_qty is null or v_qty <= 0 then raise exception 'Quantity must be more than 0.'; end if;
    if v_price is null or v_price < 0 then raise exception 'Price cannot be negative.'; end if;
    v_subtotal := v_subtotal + round(v_qty * v_price, 2);
  end loop;

  -- Discount ---------------------------------------------------------------
  if p_discount_type is null or coalesce(p_discount_value, 0) = 0 then
    v_discount := 0;
    p_discount_type := null;
    p_discount_value := null;
  elsif p_discount_type = 'percent' then
    if p_discount_value < 0 or p_discount_value > 100 then
      raise exception 'Discount %% must be between 0 and 100.';
    end if;
    v_discount := round(v_subtotal * p_discount_value / 100, 2);
  elsif p_discount_type = 'amount' then
    if p_discount_value < 0 then raise exception 'Discount cannot be negative.'; end if;
    v_discount := least(round(p_discount_value, 2), v_subtotal);
  else
    raise exception 'Unknown discount type.';
  end if;
  v_total := v_subtotal - v_discount;

  -- Bill number ------------------------------------------------------------
  -- UPDATE ... RETURNING locks this business row until the transaction ends,
  -- so two bills created at the same moment get N and N+1, never the same.
  update public.businesses
     set bill_counter = bill_counter + 1
   where id = v_business_id
  returning bill_counter into v_counter;

  v_bill_number := 'INV-' || case when v_counter < 10000
                                  then lpad(v_counter::text, 4, '0')
                                  else v_counter::text end;

  -- Customer: create, or update the name if a new one was given -----------
  insert into public.customers as c (business_id, phone, name)
  values (v_business_id, p_phone, nullif(btrim(coalesce(p_customer_name, '')), ''))
  on conflict (business_id, phone)
  do update set name = coalesce(excluded.name, c.name)
  returning c.id into v_customer_id;

  -- Public token: 24 random bytes → 32 URL-safe characters ----------------
  v_token := translate(encode(gen_random_bytes(24), 'base64'), '+/', '-_');

  insert into public.bills (business_id, customer_id, bill_number, public_token,
                            subtotal, discount, discount_type, discount_value, total, note)
  values (v_business_id, v_customer_id, v_bill_number, v_token,
          v_subtotal, v_discount, p_discount_type, p_discount_value, v_total,
          nullif(btrim(coalesce(p_note, '')), ''))
  returning id into v_bill_id;

  -- Line items -------------------------------------------------------------
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_qty   := (v_item ->> 'quantity')::numeric;
    v_price := (v_item ->> 'unit_price')::numeric;
    insert into public.bill_items (bill_id, position, item_name, quantity, unit_price, line_total)
    values (v_bill_id, v_position, btrim(v_item ->> 'item_name'), v_qty, v_price, round(v_qty * v_price, 2));
    v_position := v_position + 1;
  end loop;

  return jsonb_build_object('id', v_bill_id, 'bill_number', v_bill_number, 'public_token', v_token);
end;
$$;

revoke all on function public.create_bill(text, text, jsonb, text, numeric, text) from public, anon;
grant execute on function public.create_bill(text, text, jsonb, text, numeric, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 7. get_public_bill(token): the ONLY way the public can read a bill
-- -----------------------------------------------------------------------------
-- Returns one bill with items + business display info, or null.
-- Does not expose ids, owner ids, counters or any other bill.
create or replace function public.get_public_bill(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'bill_number',    b.bill_number,
    'public_token',   b.public_token,
    'created_at',     b.created_at,
    'subtotal',       b.subtotal,
    'discount',       b.discount,
    'discount_type',  b.discount_type,
    'discount_value', b.discount_value,
    'total',          b.total,
    'note',           b.note,
    'customer', jsonb_build_object('name', c.name, 'phone', c.phone),
    'business', jsonb_build_object(
      'name', bz.name, 'logo_url', bz.logo_url, 'address', bz.address,
      'phone', bz.phone, 'footer_note', bz.footer_note
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'item_name', i.item_name, 'quantity', i.quantity,
               'unit_price', i.unit_price, 'line_total', i.line_total
             ) order by i.position)
      from public.bill_items i where i.bill_id = b.id
    ), '[]'::jsonb)
  )
  from public.bills b
  join public.customers  c  on c.id  = b.customer_id
  join public.businesses bz on bz.id = b.business_id
  where length(p_token) between 20 and 64
    and b.public_token = p_token
$$;

revoke all on function public.get_public_bill(text) from public;
grant execute on function public.get_public_bill(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 8. customer_summaries view (customer list with totals)
-- -----------------------------------------------------------------------------
-- security_invoker = true → the caller's RLS applies, so owners only see theirs.
create or replace view public.customer_summaries
with (security_invoker = true) as
select
  c.id,
  c.business_id,
  c.phone,
  c.name,
  c.created_at,
  count(b.id)::int                         as bill_count,
  coalesce(sum(b.total), 0)::numeric(12,2) as total_spent,
  max(b.created_at)                        as last_purchase
from public.customers c
left join public.bills b on b.customer_id = c.id
group by c.id;

revoke all on public.customer_summaries from anon;
grant select on public.customer_summaries to authenticated;

-- -----------------------------------------------------------------------------
-- 9. dashboard_stats(): everything the dashboard needs, in one call
-- -----------------------------------------------------------------------------
-- All dates are bucketed in Sri Lanka time (Asia/Colombo).
create or replace function public.dashboard_stats()
returns jsonb
language sql
stable
set search_path = public
as $$
  with local_bills as (
    select b.total,
           b.customer_id,
           (b.created_at at time zone 'Asia/Colombo') as local_ts
    from public.bills b
    where b.business_id = public.my_business_id()
  ),
  today as (
    select (now() at time zone 'Asia/Colombo')::date as d
  )
  select jsonb_build_object(
    'today_sales',  (select coalesce(sum(lb.total), 0) from local_bills lb cross join today t
                      where lb.local_ts::date = t.d),
    'today_bills',  (select count(*) from local_bills lb cross join today t
                      where lb.local_ts::date = t.d),
    'month_sales',  (select coalesce(sum(lb.total), 0) from local_bills lb cross join today t
                      where date_trunc('month', lb.local_ts) = date_trunc('month', t.d::timestamp)),
    'total_bills',  (select count(*) from local_bills),
    'total_customers', (select count(*) from public.customers where business_id = public.my_business_id()),

    -- Revenue per day for the last 30 days (including days with no sales).
    'daily_revenue', (
      select jsonb_agg(jsonb_build_object('date', to_char(g.d, 'YYYY-MM-DD'),
                                          'total', coalesce(s.total, 0)) order by g.d)
      from today t
      cross join lateral generate_series(t.d::timestamp - interval '29 days',
                                         t.d::timestamp, interval '1 day') as g(d)
      left join (
        select lb.local_ts::date as d, sum(lb.total) as total
        from local_bills lb group by 1
      ) s on s.d = g.d::date
    ),

    -- Number of bills and revenue by weekday (0 = Sunday ... 6 = Saturday).
    'weekday', (
      select jsonb_agg(jsonb_build_object('dow', g.dow,
                                          'bills', coalesce(s.bills, 0),
                                          'total', coalesce(s.total, 0)) order by g.dow)
      from generate_series(0, 6) as g(dow)
      left join (
        select extract(dow from lb.local_ts)::int as dow, count(*) as bills, sum(lb.total) as total
        from local_bills lb group by 1
      ) s on s.dow = g.dow
    ),

    -- Top 5 customers by total spend.
    'top_customers', coalesce((
      select jsonb_agg(t order by t.total desc)
      from (
        select c.id, c.name, c.phone, sum(lb.total) as total, count(*) as bills
        from local_bills lb
        join public.customers c on c.id = lb.customer_id
        group by c.id
        order by total desc
        limit 5
      ) t
    ), '[]'::jsonb)
  )
$$;

revoke all on function public.dashboard_stats() from public, anon;
grant execute on function public.dashboard_stats() to authenticated;

-- -----------------------------------------------------------------------------
-- 10. STORAGE: public "logos" bucket, owners write only to their own folder
-- -----------------------------------------------------------------------------
-- Files are stored as logos/<user id>/<file name>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "logos: owner reads own folder"   on storage.objects;
drop policy if exists "logos: owner uploads own folder" on storage.objects;
drop policy if exists "logos: owner updates own folder" on storage.objects;
drop policy if exists "logos: owner deletes own folder" on storage.objects;

create policy "logos: owner reads own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "logos: owner uploads own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "logos: owner updates own folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "logos: owner deletes own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- Done!
