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

-- ---------------------------------------------------------------------------
-- 5. Starter blog posts (existing slugs are kept)
-- ---------------------------------------------------------------------------
insert into public.blog_posts (slug, title, excerpt, cover_image_url, published_at, author_name, is_published, content)
values
  ('jak-dobrac-buty-trekkingowe', 'Jak dobrać buty trekkingowe: rozmiar, membrana i sztywność', 'Buty to najważniejszy element wyposażenia. Sprawdź, na co zwrócić uwagę, zanim wybierzesz parę na szlak.', 'https://picsum.photos/seed/blog-boots/1200/600', '2026-10-02 09:00+02', 'Zespół Szczyt', true, '<p>Źle dobrane buty potrafią zepsuć nawet najlepszą wycieczkę. Zanim wybierzesz parę, zastanów się, gdzie i jak często będziesz w nich chodzić.</p>
<h2>1. Rozmiar i dopasowanie</h2>
<p>Mierz buty wieczorem, kiedy stopa jest najbardziej rozciągnięta, i w skarpetach, w których będziesz chodzić. Zostaw około 1 cm luzu przed palcami, żeby nie uderzały o czubek na zejściach. Pięta nie powinna się unosić przy stawianiu kroku.</p>
<h2>2. Wysokość cholewki</h2>
<ul><li><strong>Niskie (podejściowe):</strong> lekkie, na suche szlaki i krótsze trasy.</li><li><strong>Średnie:</strong> uniwersalne, dobrze usztywniają kostkę, sprawdzają się w Tatrach latem.</li><li><strong>Wysokie:</strong> na trudniejszy teren, z ciężkim plecakiem i zimą.</li></ul>
<h2>3. Membrana</h2>
<p>Membrana (np. typu GTX) chroni przed wodą, ale jest mniej przewiewna. Na upały i suche szlaki bywa zbędna, na zmienną pogodę i błoto bardzo się przydaje.</p>
<h2>4. Sztywność podeszwy</h2>
<p>Im trudniejszy teren i cięższy plecak, tym sztywniejsza podeszwa. Zimą i pod raki potrzebujesz modelu, który to przewiduje.</p>
<p>Nowe buty rozchodź przed wyprawą na kilku krótkich spacerach. Szukasz konkretnego modelu? Zobacz <a href="/products">nasze obuwie trekkingowe</a> albo zapytaj asystenta w czacie.</p>'),
  ('co-spakowac-do-plecaka-na-jednodniowa-wycieczke', 'Co spakować do plecaka na jednodniową wycieczkę w góry', 'Lista rzeczy, które warto mieć ze sobą, nawet jeśli prognoza wygląda świetnie.', 'https://picsum.photos/seed/blog-backpack/1200/600', '2026-10-05 09:00+02', 'Zespół Szczyt', true, '<p>Pogoda w górach zmienia się szybko, więc plecak na jeden dzień powinien być przygotowany na więcej niż sam spacer. Do większości wycieczek wystarczy plecak 20–30 litrów.</p>
<h2>Podstawa</h2>
<ul><li>woda (minimum 1,5 l) i jedzenie z zapasem, np. batony, orzechy, kanapki,</li><li>cienka kurtka przeciwdeszczowa, nawet przy dobrej prognozie,</li><li>dodatkowa warstwa: polar lub lekka kurtka puchowa,</li><li>czapka i rękawiczki poza sezonem letnim, okulary i krem z filtrem latem,</li><li>mapa lub aplikacja z mapą offline, naładowany telefon i powerbank.</li></ul>
<h2>Bezpieczeństwo</h2>
<ul><li>czołówka z zapasowymi bateriami, bo zejście potrafi się przedłużyć,</li><li>mała apteczka i folia NRC,</li><li>gwizdek i numer ratunkowy w górach: <strong>985</strong> lub <strong>601 100 300</strong>.</li></ul>
<h2>Jak to spakować</h2>
<p>Ciężkie rzeczy trzymaj blisko pleców, na środku wysokości plecaka. To, czego możesz potrzebować szybko (kurtka, przekąska), włóż na wierzch lub do bocznej kieszeni. Dopasuj pas biodrowy, żeby ciężar spoczywał na biodrach, a nie na barkach.</p>
<p>Przejrzyj <a href="/products">plecaki i akcesoria</a> w naszej ofercie.</p>'),
  ('warstwowy-ubior-w-gorach', 'Warstwowy ubiór w górach: trzy warstwy, które działają', 'Dlaczego jedna gruba kurtka to zły pomysł i jak ubrać się na zmienną pogodę.', 'https://picsum.photos/seed/blog-layers/1200/600', '2026-10-08 09:00+02', 'Zespół Szczyt', true, '<p>W górach temperatura zmienia się z wysokością i wysiłkiem. Zamiast jednej grubej kurtki lepiej sprawdza się system warstw, który można zdejmować i zakładać w trakcie marszu.</p>
<h2>Warstwa 1: bielizna termoaktywna</h2>
<p>Przylega do skóry i odprowadza pot. Unikaj bawełny: nasiąka, długo schnie i szybko wychładza. Dobrze działa syntetyk lub wełna merino.</p>
<h2>Warstwa 2: ocieplenie</h2>
<p>Polar, lekka kurtka puchowa lub syntetyczna. Jej zadaniem jest zatrzymywanie ciepła. Puch jest lekki i bardzo ciepły, ale traci właściwości, gdy zamoknie, dlatego przyda się na postoje i zimne dni.</p>
<h2>Warstwa 3: ochrona przed wiatrem i deszczem</h2>
<p>Softshell chroni przed wiatrem i lekkim deszczem i jest oddychający. Przy dłuższym deszczu potrzebna jest kurtka z membraną.</p>
<h2>Zasada praktyczna</h2>
<p>Zdejmuj warstwę, zanim się spocisz, i zakładaj ją, zanim zmarzniesz. Na podejściu zwykle wystarczy mniej, na postoju dołóż ciepłą warstwę.</p>
<p>Zobacz <a href="/products">odzież górską</a> w naszym sklepie.</p>'),
  ('jak-dbac-o-sprzet-gorski', 'Jak dbać o sprzęt górski, żeby służył latami', 'Pranie kurtek, suszenie butów i przechowywanie: proste nawyki, które wydłużają życie sprzętu.', 'https://picsum.photos/seed/blog-care/1200/600', '2026-10-12 09:00+02', 'Zespół Szczyt', true, '<p>Dobry sprzęt jest inwestycją, a kilka prostych nawyków pozwoli Ci korzystać z niego znacznie dłużej.</p>
<h2>Kurtki i odzież</h2>
<ul><li>Pierz zgodnie z metką, najlepiej w płynie przeznaczonym do odzieży technicznej, bez płynu zmiękczającego.</li><li>Membrany i impregnacja z czasem słabną. Odnawiaj impregnację, gdy woda przestaje się perlić.</li><li>Kurtki puchowe przechowuj luźno, nie ściśnięte w worku kompresyjnym.</li></ul>
<h2>Buty</h2>
<ul><li>Po wycieczce wyczyść je z błota i wysusz w temperaturze pokojowej, z dala od kaloryfera i ognia.</li><li>Wyjmij wkładki, żeby szybciej schły.</li><li>Okresowo konserwuj skórę i impregnuj buty.</li></ul>
<h2>Sprzęt wspinaczkowy</h2>
<ul><li>Linę, uprząż i taśmy trzymaj w suchym, ciemnym miejscu, z dala od chemikaliów i ostrych krawędzi.</li><li>Sprawdzaj stan przed każdym użyciem i stosuj się do zaleceń producenta dotyczących wycofania sprzętu.</li></ul>
<p>Pytania o konkretny produkt? Napisz do asystenta w czacie.</p>')
on conflict (slug) do nothing;
