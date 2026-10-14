-- 0002 · Row Level Security for the core tables.

-- Used inside policies. SECURITY DEFINER so it can read profiles without
-- recursing into the profiles policies.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'Admin');
$$;

alter table public.profiles       enable row level security;
alter table public.categories     enable row level security;
alter table public.products       enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.payments       enable row level security;
alter table public.site_settings  enable row level security;

-- Profiles: you see yourself, admins see everyone.
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- Self-service updates are limited to name columns. Without the column grant a
-- customer could run `update profiles set role = 'Admin'` on their own row.
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from anon, authenticated;
grant update (first_name, last_name) on public.profiles to authenticated;

-- Categories: public read, admin write.
create policy categories_select on public.categories for select using (true);
create policy categories_insert on public.categories for insert with check (public.is_admin());
create policy categories_update on public.categories for update using (public.is_admin());
create policy categories_delete on public.categories for delete using (public.is_admin());

-- Products: public sees active ones, admin manages everything.
create policy products_select on public.products
  for select using (is_active or public.is_admin());
create policy products_insert on public.products for insert with check (public.is_admin());
create policy products_update on public.products for update using (public.is_admin());
create policy products_delete on public.products for delete using (public.is_admin());

-- Orders and their rows are created exclusively through create_order() (SECURITY DEFINER),
-- so there are deliberately no INSERT policies for customers.
create policy orders_select on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy orders_update_admin on public.orders
  for update using (public.is_admin());

create policy order_items_select on public.order_items
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid())
  );

-- Payments are written only by Edge Functions (service role) — customers may read their own.
create policy payments_select on public.payments
  for select using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = payments.order_id and o.user_id = auth.uid())
  );

-- Site settings: public read, admin write.
create policy site_settings_select on public.site_settings for select using (true);
create policy site_settings_insert on public.site_settings for insert with check (public.is_admin());
create policy site_settings_update on public.site_settings for update using (public.is_admin());
