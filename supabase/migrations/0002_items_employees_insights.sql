-- =============================================================================
-- BillBook — migration 2: My items, Employees, Insights
-- Run this ONCE in Supabase → SQL Editor → New query → paste → Run
-- (after 0001_init.sql). Safe to re-run.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. MY ITEMS: saved item list (name + last price) per business
-- -----------------------------------------------------------------------------
create table if not exists public.items (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 200),
  price        numeric(12,2) not null default 0 check (price >= 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
-- One entry per name (case-insensitive) per business.
create unique index if not exists items_business_name_uq on public.items (business_id, lower(name));

alter table public.items enable row level security;
revoke all on public.items from anon;

-- -----------------------------------------------------------------------------
-- 2. EMPLOYEES: staff invited by email
-- -----------------------------------------------------------------------------
-- The owner adds an email. When someone logs in with that email, the invite
-- is linked to their account (claim_invites) and they work in this shop.
create table if not exists public.business_members (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  email        text not null check (email = lower(email) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  user_id      uuid references auth.users (id) on delete cascade,
  role         text not null default 'staff' check (role in ('staff')),
  created_at   timestamptz not null default now(),
  unique (business_id, email)
);
-- A staff account belongs to one shop only.
create unique index if not exists business_members_user_uq
  on public.business_members (user_id) where user_id is not null;

alter table public.business_members enable row level security;
revoke all on public.business_members from anon;

-- -----------------------------------------------------------------------------
-- 3. HELPERS
-- -----------------------------------------------------------------------------
-- The caller's shop: the one they own, otherwise the one they work in.
create or replace function public.my_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select id from public.businesses where owner_id = auth.uid()),
    (select business_id from public.business_members where user_id = auth.uid() limit 1)
  )
$$;

-- Is the caller the OWNER (not staff) of a shop?
create or replace function public.is_business_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.businesses where owner_id = auth.uid())
$$;

-- Link a pending invite to the logged-in user (matched by email).
-- Returns the user's business id (or null if none).
create or replace function public.claim_invites()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then
    return null;
  end if;

  if v_email <> ''
     and not exists (select 1 from public.businesses where owner_id = auth.uid())
     and not exists (select 1 from public.business_members where user_id = auth.uid()) then
    update public.business_members
       set user_id = auth.uid()
     where id = (
       select id from public.business_members
        where email = v_email and user_id is null
        order by created_at
        limit 1
     );
  end if;

  return public.my_business_id();
end;
$$;

revoke all on function public.claim_invites() from public, anon;
grant execute on function public.claim_invites() to authenticated;
revoke all on function public.is_business_owner() from public, anon;
grant execute on function public.is_business_owner() to authenticated;

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (updated for staff)
-- -----------------------------------------------------------------------------
-- businesses: staff can READ their shop; only the owner can edit it.
drop policy if exists "owner reads own business" on public.businesses;
drop policy if exists "members read business"    on public.businesses;
create policy "members read business" on public.businesses
  for select to authenticated
  using (owner_id = auth.uid() or id = public.my_business_id());

-- bills: only the owner can delete.
drop policy if exists "owner deletes own bills" on public.bills;
create policy "owner deletes own bills" on public.bills
  for delete to authenticated
  using (business_id = public.my_business_id() and public.is_business_owner());

-- items: owner and staff manage the shop's item list.
drop policy if exists "members manage items" on public.items;
create policy "members manage items" on public.items
  for all to authenticated
  using (business_id = public.my_business_id())
  with check (business_id = public.my_business_id());
grant select, insert, update, delete on public.items to authenticated;

-- business_members: everyone in the shop can see the team; only the owner adds/removes.
drop policy if exists "members read team"    on public.business_members;
drop policy if exists "owner adds staff"     on public.business_members;
drop policy if exists "owner removes staff"  on public.business_members;
create policy "members read team" on public.business_members
  for select to authenticated
  using (business_id = public.my_business_id() or user_id = auth.uid());
create policy "owner adds staff" on public.business_members
  for insert to authenticated
  with check (public.is_business_owner() and business_id = public.my_business_id());
create policy "owner removes staff" on public.business_members
  for delete to authenticated
  using (public.is_business_owner() and business_id = public.my_business_id());

revoke insert, update on public.business_members from authenticated;
grant insert (business_id, email) on public.business_members to authenticated;
grant select, delete on public.business_members to authenticated;

-- -----------------------------------------------------------------------------
-- 5. create_bill(): now works for staff, and saves items to "My items"
-- -----------------------------------------------------------------------------
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
  v_business_id := public.my_business_id();
  if v_business_id is null then
    raise exception 'Please set up your business profile first.';
  end if;

  if p_phone is null or p_phone !~ '^\+947[0-9]{8}$' then
    raise exception 'Invalid mobile number. Use 07XXXXXXXX.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one item.';
  end if;
  if jsonb_array_length(p_items) > 200 then
    raise exception 'Too many items on one bill (max 200).';
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_name  := btrim(coalesce(v_item ->> 'item_name', ''));
    v_qty   := (v_item ->> 'quantity')::numeric;
    v_price := (v_item ->> 'unit_price')::numeric;
    if v_name = '' then raise exception 'Every item needs a name.'; end if;
    if v_qty is null or v_qty <= 0 then raise exception 'Quantity must be more than 0.'; end if;
    if v_price is null or v_price < 0 then raise exception 'Price cannot be negative.'; end if;
    v_subtotal := v_subtotal + round(v_qty * v_price, 2);
  end loop;

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

  -- Row lock on the business → bill numbers never repeat.
  update public.businesses
     set bill_counter = bill_counter + 1
   where id = v_business_id
  returning bill_counter into v_counter;

  v_bill_number := 'INV-' || case when v_counter < 10000
                                  then lpad(v_counter::text, 4, '0')
                                  else v_counter::text end;

  insert into public.customers as c (business_id, phone, name)
  values (v_business_id, p_phone, nullif(btrim(coalesce(p_customer_name, '')), ''))
  on conflict (business_id, phone)
  do update set name = coalesce(excluded.name, c.name)
  returning c.id into v_customer_id;

  v_token := translate(encode(gen_random_bytes(24), 'base64'), '+/', '-_');

  insert into public.bills (business_id, customer_id, bill_number, public_token,
                            subtotal, discount, discount_type, discount_value, total, note)
  values (v_business_id, v_customer_id, v_bill_number, v_token,
          v_subtotal, v_discount, p_discount_type, p_discount_value, v_total,
          nullif(btrim(coalesce(p_note, '')), ''))
  returning id into v_bill_id;

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_name  := btrim(v_item ->> 'item_name');
    v_qty   := (v_item ->> 'quantity')::numeric;
    v_price := (v_item ->> 'unit_price')::numeric;

    insert into public.bill_items (bill_id, position, item_name, quantity, unit_price, line_total)
    values (v_bill_id, v_position, v_name, v_qty, v_price, round(v_qty * v_price, 2));
    v_position := v_position + 1;

    -- Remember the item and its latest price in "My items".
    insert into public.items as it (business_id, name, price)
    values (v_business_id, left(v_name, 200), v_price)
    on conflict (business_id, lower(name))
    do update set price = excluded.price, updated_at = now();
  end loop;

  return jsonb_build_object('id', v_bill_id, 'bill_number', v_bill_number, 'public_token', v_token);
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. dashboard_stats(): adds all-time sales, average bill, last 6 months
-- -----------------------------------------------------------------------------
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
    'month_bills',  (select count(*) from local_bills lb cross join today t
                      where date_trunc('month', lb.local_ts) = date_trunc('month', t.d::timestamp)),
    'all_time_sales', (select coalesce(sum(total), 0) from local_bills),
    'avg_bill',     (select coalesce(round(avg(total), 2), 0) from local_bills),
    'total_bills',  (select count(*) from local_bills),
    'total_customers', (select count(*) from public.customers where business_id = public.my_business_id()),

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

    'monthly_revenue', (
      select jsonb_agg(jsonb_build_object('month', to_char(g.m, 'YYYY-MM'),
                                          'total', coalesce(s.total, 0),
                                          'bills', coalesce(s.bills, 0)) order by g.m)
      from today t
      cross join lateral generate_series(date_trunc('month', t.d::timestamp) - interval '5 months',
                                         date_trunc('month', t.d::timestamp), interval '1 month') as g(m)
      left join (
        select date_trunc('month', lb.local_ts) as m, sum(lb.total) as total, count(*) as bills
        from local_bills lb group by 1
      ) s on s.m = g.m
    ),

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

-- Done!
