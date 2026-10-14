-- Upgrade script for a database created from the OLD scripts (schema.sql / 002).
-- Safe to run more than once. Paste into Supabase -> SQL Editor -> New query -> Run.
--
-- It (1) creates the page-builder, blog and payment objects that older databases lack,
-- (2) hardens security, (3) refreshes the home page content.
-- It does NOT touch your products, orders, users or footer data.

-- ---------------------------------------------------------------------------
-- 1. Missing tables
-- ---------------------------------------------------------------------------
create table if not exists public.pages (
  id          integer generated always as identity primary key,
  slug        text not null unique,
  title       text not null,
  is_system   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.page_blocks (
  id          integer generated always as identity primary key,
  page_id     integer not null references public.pages(id) on delete cascade,
  type        text not null check (type in ('hero', 'rich_text', 'gallery', 'categories', 'featured_products', 'banner')),
  "order"     integer not null default 0,
  is_visible  boolean not null default true,
  content     jsonb not null default '{}'::jsonb,
  style       jsonb not null default '{}'::jsonb
);

create table if not exists public.blog_posts (
  id               integer generated always as identity primary key,
  slug             text not null unique,
  title            text not null,
  excerpt          text not null default '',
  cover_image_url  text,
  content          text not null default '',
  author_name      text not null default 'Szczyt',
  is_published     boolean not null default false,
  published_at     timestamptz,
  created_at       timestamptz not null default now()
);

alter table public.payments add column if not exists provider text not null default 'przelewy24';
alter table public.payments add column if not exists provider_session_id text;
alter table public.payments add column if not exists redirect_url text;
alter table public.order_items
  add column if not exists line_total numeric(10,2) generated always as (unit_price * quantity) stored;

insert into public.pages (slug, title, is_system) values ('home', 'Strona główna', true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Row Level Security for the new tables
-- ---------------------------------------------------------------------------
alter table public.pages        enable row level security;
alter table public.page_blocks  enable row level security;
alter table public.blog_posts   enable row level security;

drop policy if exists pages_select on public.pages;
drop policy if exists pages_insert on public.pages;
drop policy if exists pages_update on public.pages;
drop policy if exists pages_delete on public.pages;
create policy pages_select on public.pages for select using (true);
create policy pages_insert on public.pages for insert with check (public.is_admin());
create policy pages_update on public.pages for update using (public.is_admin());
create policy pages_delete on public.pages for delete using (public.is_admin() and not is_system);

drop policy if exists page_blocks_select on public.page_blocks;
drop policy if exists page_blocks_insert on public.page_blocks;
drop policy if exists page_blocks_update on public.page_blocks;
drop policy if exists page_blocks_delete on public.page_blocks;
create policy page_blocks_select on public.page_blocks for select using (is_visible or public.is_admin());
create policy page_blocks_insert on public.page_blocks for insert with check (public.is_admin());
create policy page_blocks_update on public.page_blocks for update using (public.is_admin());
create policy page_blocks_delete on public.page_blocks for delete using (public.is_admin());

drop policy if exists blog_posts_select on public.blog_posts;
drop policy if exists blog_posts_insert on public.blog_posts;
drop policy if exists blog_posts_update on public.blog_posts;
drop policy if exists blog_posts_delete on public.blog_posts;
create policy blog_posts_select on public.blog_posts for select using (is_published or public.is_admin());
create policy blog_posts_insert on public.blog_posts for insert with check (public.is_admin());
create policy blog_posts_update on public.blog_posts for update using (public.is_admin());
create policy blog_posts_delete on public.blog_posts for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Hardening
-- ---------------------------------------------------------------------------
-- No free "mock" payments.
drop function if exists public.pay_order(integer, text);

-- Customers may only change their own name, never their role.
drop policy if exists profiles_update_own_or_admin on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from anon, authenticated;
grant update (first_name, last_name) on public.profiles to authenticated;

-- Payments are written by Edge Functions only (service role).
-- Orders and their rows are created through create_order() only.
drop policy if exists orders_insert_own on public.orders;
drop policy if exists order_items_insert_own on public.order_items;
drop policy if exists payments_insert_own on public.payments;
drop policy if exists payments_update_own_or_admin on public.payments;

-- The chat model used by older installs has been retired.
update public.chatbot_settings set model = 'claude-haiku-5-5'
where model like 'claude-3-5-haiku%';

-- ---------------------------------------------------------------------------
-- 4. Home page content (replaces ALL blocks of the 'home' page)
-- ---------------------------------------------------------------------------
delete from public.page_blocks
where page_id = (select id from public.pages where slug = 'home');

insert into public.page_blocks (page_id, type, "order", content, style)
select pg.id, b.type, b."order", b.content, b.style
from public.pages pg,
(values
  ('hero', 1, '{"title": "Sprzęt, który zabierze Cię na szczyt", "subtitle": "Odzież, obuwie i ekwipunek górski sprawdzony na szlaku. Wyrusz przygotowany.", "buttonText": "Zobacz nowości", "buttonLink": "/products"}'::jsonb, '{"backgroundColor": "#2f4a3c", "textColor": "#ffffff", "paddingSize": "lg", "backgroundImageUrl": "https://picsum.photos/seed/szczyt-hero/1600/700"}'::jsonb),
  ('rich_text', 2, '{"html": "<div class=\"pb-usp\"><div><span>🚚</span><strong>Szybka wysyłka</strong><p>Zamówienia opłacone do 14:00 wysyłamy tego samego dnia.</p></div><div><span>↩️</span><strong>30 dni na zwrot</strong><p>Nie pasuje? Zwróć bez podawania przyczyny.</p></div><div><span>🛡️</span><strong>Gwarancja producenta</strong><p>Sprawdzony sprzęt z 2-letnią gwarancją.</p></div><div><span>🔒</span><strong>Bezpieczne płatności</strong><p>BLIK, karta i szybki przelew przez Przelewy24.</p></div></div>", "wide": true}'::jsonb, '{"backgroundColor": "#ffffff", "paddingSize": "sm"}'::jsonb),
  ('categories', 3, '{"title": "Kupuj według kategorii", "subtitle": "Wszystko, czego potrzebujesz na wyprawę, w jednym miejscu"}'::jsonb, '{}'::jsonb),
  ('featured_products', 4, '{"title": "Polecane produkty", "subtitle": "Najnowsze i najchętniej wybierane w tym sezonie"}'::jsonb, '{}'::jsonb),
  ('banner', 5, '{"title": "Wyprzedaż sezonu zimowego", "subtitle": "Do -30% na wybraną odzież puchową i obuwie zimowe", "buttonText": "Zobacz promocje", "buttonLink": "/products"}'::jsonb, '{"backgroundColor": "#1f332a", "textColor": "#ffffff", "backgroundImageUrl": "https://picsum.photos/seed/mountainbanner/1200/400"}'::jsonb),
  ('rich_text', 6, '{"html": "<h2>Sprzęt dobrany przez ludzi z gór</h2><p>Szczyt to sklep dla tych, którzy wolą szlak od kanapy: od pierwszej wycieczki w Tatry po wyprawy w wyższe góry. Wybieramy sprzęt, który sprawdza się w deszczu, wietrze i na mrozie, a nie tylko na zdjęciach.</p><ul><li>Odzież na każdą pogodę: softshelle, puch, bielizna termoaktywna.</li><li>Sprzęt wspinaczkowy: uprzęże, raki, czekany.</li><li>Plecaki, kijki i akcesoria biwakowe na jeden dzień i na tydzień.</li></ul><p>Nie wiesz, co wybrać? Zapytaj asystenta w czacie w prawym dolnym rogu albo zajrzyj na nasz <a href=\"/blog\">blog</a>.</p>"}'::jsonb, '{"backgroundColor": "#ffffff", "paddingSize": "md"}'::jsonb),
  ('banner', 7, '{"title": "Porady na szlak i do skałek", "subtitle": "Jak dobrać buty, plecak i odzież? Czytaj nasz blog.", "buttonText": "Przejdź do bloga", "buttonLink": "/blog"}'::jsonb, '{"backgroundColor": "#d97b3f", "textColor": "#ffffff", "paddingSize": "md"}'::jsonb)
) as b(type, "order", content, style)
where pg.slug = 'home';
