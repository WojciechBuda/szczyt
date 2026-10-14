-- 0001 · Core schema: profiles, catalogue, orders, payments, site settings.
-- Run order matters; apply all files in this folder with `supabase db push`
-- or paste them one by one into the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users with name and role)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null default '',
  first_name  text not null default '',
  last_name   text not null default '',
  role        text not null default 'Customer' check (role in ('Customer', 'Admin')),
  created_at  timestamptz not null default now()
);

-- Creates the profile row automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table public.categories (
  id           integer generated always as identity primary key,
  name         text not null,
  description  text
);

create table public.products (
  id           integer generated always as identity primary key,
  name         text not null,
  description  text not null default '',
  price        numeric(10,2) not null check (price >= 0),
  stock        integer not null default 0 check (stock >= 0),
  image_url    text,
  is_active    boolean not null default true,
  category_id  integer not null references public.categories(id),
  created_at   timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);

-- ---------------------------------------------------------------------------
-- Orders and payments
-- ---------------------------------------------------------------------------
create table public.orders (
  id                    integer generated always as identity primary key,
  user_id               uuid not null references public.profiles(id),
  order_date            timestamptz not null default now(),
  status                text not null default 'Pending'
                        check (status in ('Pending', 'Paid', 'Shipped', 'Completed', 'Cancelled')),
  total_amount          numeric(10,2) not null default 0,
  shipping_street       text not null,
  shipping_city         text not null,
  shipping_postal_code  text not null,
  shipping_country      text not null
);
create index orders_user_idx on public.orders (user_id);

-- Product name, image and price are copied here so order history survives
-- later edits or removal of the product.
create table public.order_items (
  id            integer generated always as identity primary key,
  order_id      integer not null references public.orders(id) on delete cascade,
  product_id    integer not null references public.products(id),
  product_name  text not null,
  image_url     text,
  unit_price    numeric(10,2) not null,
  quantity      integer not null check (quantity > 0),
  line_total    numeric(10,2) generated always as (unit_price * quantity) stored
);
create index order_items_order_idx on public.order_items (order_id);

create table public.payments (
  id                   integer generated always as identity primary key,
  order_id             integer not null unique references public.orders(id) on delete cascade,
  amount               numeric(10,2) not null,
  method               text not null default 'przelewy24',
  status               text not null default 'Pending' check (status in ('Pending', 'Succeeded', 'Failed')),
  provider             text not null default 'przelewy24',
  provider_session_id  text,
  redirect_url         text,
  transaction_ref      text,
  paid_at              timestamptz
);

-- ---------------------------------------------------------------------------
-- Site settings (single row, editable from the admin panel)
-- ---------------------------------------------------------------------------
create table public.site_settings (
  id             integer primary key default 1,
  footer_text    text not null default '',
  contact_email  text,
  constraint site_settings_singleton check (id = 1)
);
