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
  ('hero', 1, '{"title": "Sprzęt, który zabierze Cię na szczyt", "subtitle": "Odzież, obuwie i ekwipunek górski sprawdzony na szlaku. Wyrusz przygotowany.", "buttonText": "Zobacz nowości", "buttonLink": "/products"}'::jsonb, '{"backgroundColor": "#2f4a3c", "textColor": "#ffffff", "paddingSize": "lg", "backgroundImageUrl": "/img/hero.jpg"}'::jsonb),
  ('rich_text', 2, '{"html": "<div class=\"pb-usp\"><div><span>🚚</span><strong>Szybka wysyłka</strong><p>Zamówienia opłacone do 14:00 wysyłamy tego samego dnia.</p></div><div><span>↩️</span><strong>30 dni na zwrot</strong><p>Nie pasuje? Zwróć bez podawania przyczyny.</p></div><div><span>🛡️</span><strong>Gwarancja producenta</strong><p>Sprawdzony sprzęt z 2-letnią gwarancją.</p></div><div><span>🔒</span><strong>Bezpieczne płatności</strong><p>BLIK, karta i szybki przelew przez Przelewy24.</p></div></div>", "wide": true}'::jsonb, '{"backgroundColor": "#ffffff", "paddingSize": "sm"}'::jsonb),
  ('categories', 3, '{"title": "Kupuj według kategorii", "subtitle": "Wszystko, czego potrzebujesz na wyprawę, w jednym miejscu"}'::jsonb, '{}'::jsonb),
  ('featured_products', 4, '{"title": "Polecane produkty", "subtitle": "Najnowsze i najchętniej wybierane w tym sezonie"}'::jsonb, '{}'::jsonb),
  ('banner', 5, '{"title": "Wyprzedaż sezonu zimowego", "subtitle": "Do -30% na wybraną odzież puchową i obuwie zimowe", "buttonText": "Zobacz promocje", "buttonLink": "/products"}'::jsonb, '{"backgroundColor": "#1f332a", "textColor": "#ffffff", "backgroundImageUrl": "/img/banner-winter.jpg"}'::jsonb),
  ('rich_text', 6, '{"html": "<h2>Sprzęt dobrany przez ludzi z gór</h2><p>Szczyt to sklep dla tych, którzy wolą szlak od kanapy: od pierwszej wycieczki w Tatry po wyprawy w wyższe góry. Wybieramy sprzęt, który sprawdza się w deszczu, wietrze i na mrozie, a nie tylko na zdjęciach.</p><ul><li>Odzież na każdą pogodę: softshelle, puch, bielizna termoaktywna.</li><li>Sprzęt wspinaczkowy: uprzęże, raki, czekany.</li><li>Plecaki, kijki i akcesoria biwakowe na jeden dzień i na tydzień.</li></ul><p>Nie wiesz, co wybrać? Zapytaj asystenta w czacie w prawym dolnym rogu albo zajrzyj na nasz <a href=\"/blog\">blog</a>.</p>"}'::jsonb, '{"backgroundColor": "#ffffff", "paddingSize": "md"}'::jsonb),
  ('banner', 7, '{"title": "Porady na szlak i do skałek", "subtitle": "Jak dobrać buty, plecak i odzież? Czytaj nasz blog.", "buttonText": "Przejdź do bloga", "buttonLink": "/blog"}'::jsonb, '{"backgroundColor": "#d97b3f", "textColor": "#ffffff", "paddingSize": "md"}'::jsonb)
) as b(type, "order", content, style)
where pg.slug = 'home';

-- ---------------------------------------------------------------------------
-- 5. Starter blog posts (existing slugs are kept)
-- ---------------------------------------------------------------------------
insert into public.blog_posts (slug, title, excerpt, cover_image_url, published_at, author_name, is_published, content)
values
  ('jak-dobrac-buty-trekkingowe', 'Jak dobrać buty trekkingowe: rozmiar, membrana i sztywność', 'Buty to najważniejszy element wyposażenia. Sprawdź, na co zwrócić uwagę, zanim wybierzesz parę na szlak.', '/img/blog-boots.jpg', '2026-10-02 09:00+02', 'Zespół Szczyt', true, '<p>Źle dobrane buty potrafią zepsuć nawet najlepszą wycieczkę. Zanim wybierzesz parę, zastanów się, gdzie i jak często będziesz w nich chodzić.</p>
<h2>1. Rozmiar i dopasowanie</h2>
<p>Mierz buty wieczorem, kiedy stopa jest najbardziej rozciągnięta, i w skarpetach, w których będziesz chodzić. Zostaw około 1 cm luzu przed palcami, żeby nie uderzały o czubek na zejściach. Pięta nie powinna się unosić przy stawianiu kroku.</p>
<h2>2. Wysokość cholewki</h2>
<ul><li><strong>Niskie (podejściowe):</strong> lekkie, na suche szlaki i krótsze trasy.</li><li><strong>Średnie:</strong> uniwersalne, dobrze usztywniają kostkę, sprawdzają się w Tatrach latem.</li><li><strong>Wysokie:</strong> na trudniejszy teren, z ciężkim plecakiem i zimą.</li></ul>
<h2>3. Membrana</h2>
<p>Membrana (np. typu GTX) chroni przed wodą, ale jest mniej przewiewna. Na upały i suche szlaki bywa zbędna, na zmienną pogodę i błoto bardzo się przydaje.</p>
<h2>4. Sztywność podeszwy</h2>
<p>Im trudniejszy teren i cięższy plecak, tym sztywniejsza podeszwa. Zimą i pod raki potrzebujesz modelu, który to przewiduje.</p>
<p>Nowe buty rozchodź przed wyprawą na kilku krótkich spacerach. Szukasz konkretnego modelu? Zobacz <a href="/products">nasze obuwie trekkingowe</a> albo zapytaj asystenta w czacie.</p>'),
  ('co-spakowac-do-plecaka-na-jednodniowa-wycieczke', 'Co spakować do plecaka na jednodniową wycieczkę w góry', 'Lista rzeczy, które warto mieć ze sobą, nawet jeśli prognoza wygląda świetnie.', '/img/blog-backpack.jpg', '2026-10-05 09:00+02', 'Zespół Szczyt', true, '<p>Pogoda w górach zmienia się szybko, więc plecak na jeden dzień powinien być przygotowany na więcej niż sam spacer. Do większości wycieczek wystarczy plecak 20–30 litrów.</p>
<h2>Podstawa</h2>
<ul><li>woda (minimum 1,5 l) i jedzenie z zapasem, np. batony, orzechy, kanapki,</li><li>cienka kurtka przeciwdeszczowa, nawet przy dobrej prognozie,</li><li>dodatkowa warstwa: polar lub lekka kurtka puchowa,</li><li>czapka i rękawiczki poza sezonem letnim, okulary i krem z filtrem latem,</li><li>mapa lub aplikacja z mapą offline, naładowany telefon i powerbank.</li></ul>
<h2>Bezpieczeństwo</h2>
<ul><li>czołówka z zapasowymi bateriami, bo zejście potrafi się przedłużyć,</li><li>mała apteczka i folia NRC,</li><li>gwizdek i numer ratunkowy w górach: <strong>985</strong> lub <strong>601 100 300</strong>.</li></ul>
<h2>Jak to spakować</h2>
<p>Ciężkie rzeczy trzymaj blisko pleców, na środku wysokości plecaka. To, czego możesz potrzebować szybko (kurtka, przekąska), włóż na wierzch lub do bocznej kieszeni. Dopasuj pas biodrowy, żeby ciężar spoczywał na biodrach, a nie na barkach.</p>
<p>Przejrzyj <a href="/products">plecaki i akcesoria</a> w naszej ofercie.</p>'),
  ('warstwowy-ubior-w-gorach', 'Warstwowy ubiór w górach: trzy warstwy, które działają', 'Dlaczego jedna gruba kurtka to zły pomysł i jak ubrać się na zmienną pogodę.', '/img/blog-layers.jpg', '2026-10-08 09:00+02', 'Zespół Szczyt', true, '<p>W górach temperatura zmienia się z wysokością i wysiłkiem. Zamiast jednej grubej kurtki lepiej sprawdza się system warstw, który można zdejmować i zakładać w trakcie marszu.</p>
<h2>Warstwa 1: bielizna termoaktywna</h2>
<p>Przylega do skóry i odprowadza pot. Unikaj bawełny: nasiąka, długo schnie i szybko wychładza. Dobrze działa syntetyk lub wełna merino.</p>
<h2>Warstwa 2: ocieplenie</h2>
<p>Polar, lekka kurtka puchowa lub syntetyczna. Jej zadaniem jest zatrzymywanie ciepła. Puch jest lekki i bardzo ciepły, ale traci właściwości, gdy zamoknie, dlatego przyda się na postoje i zimne dni.</p>
<h2>Warstwa 3: ochrona przed wiatrem i deszczem</h2>
<p>Softshell chroni przed wiatrem i lekkim deszczem i jest oddychający. Przy dłuższym deszczu potrzebna jest kurtka z membraną.</p>
<h2>Zasada praktyczna</h2>
<p>Zdejmuj warstwę, zanim się spocisz, i zakładaj ją, zanim zmarzniesz. Na podejściu zwykle wystarczy mniej, na postoju dołóż ciepłą warstwę.</p>
<p>Zobacz <a href="/products">odzież górską</a> w naszym sklepie.</p>'),
  ('jak-dbac-o-sprzet-gorski', 'Jak dbać o sprzęt górski, żeby służył latami', 'Pranie kurtek, suszenie butów i przechowywanie: proste nawyki, które wydłużają życie sprzętu.', '/img/blog-care.jpg', '2026-10-12 09:00+02', 'Zespół Szczyt', true, '<p>Dobry sprzęt jest inwestycją, a kilka prostych nawyków pozwoli Ci korzystać z niego znacznie dłużej.</p>
<h2>Kurtki i odzież</h2>
<ul><li>Pierz zgodnie z metką, najlepiej w płynie przeznaczonym do odzieży technicznej, bez płynu zmiękczającego.</li><li>Membrany i impregnacja z czasem słabną. Odnawiaj impregnację, gdy woda przestaje się perlić.</li><li>Kurtki puchowe przechowuj luźno, nie ściśnięte w worku kompresyjnym.</li></ul>
<h2>Buty</h2>
<ul><li>Po wycieczce wyczyść je z błota i wysusz w temperaturze pokojowej, z dala od kaloryfera i ognia.</li><li>Wyjmij wkładki, żeby szybciej schły.</li><li>Okresowo konserwuj skórę i impregnuj buty.</li></ul>
<h2>Sprzęt wspinaczkowy</h2>
<ul><li>Linę, uprząż i taśmy trzymaj w suchym, ciemnym miejscu, z dala od chemikaliów i ostrych krawędzi.</li><li>Sprawdzaj stan przed każdym użyciem i stosuj się do zaleceń producenta dotyczących wycofania sprzętu.</li></ul>
<p>Pytania o konkretny produkt? Napisz do asystenta w czacie.</p>')
on conflict (slug) do nothing;
-- 0008 · Serve images from the site itself (/img/*.jpg, see tools/generate_images.py)
-- instead of random external placeholders. Only rows that still use a placeholder
-- (empty, picsum.photos or placehold.co) are changed; your own uploads are kept.

update public.products p
set image_url = '/img/product-' || case c.name
    when 'Odzież górska'        then 'clothing'
    when 'Sprzęt wspinaczkowy'  then 'climbing'
    when 'Plecaki i akcesoria'  then 'backpacks'
    when 'Obuwie trekkingowe'   then 'boots'
    else 'default' end || '.jpg'
from public.categories c
where c.id = p.category_id
  and (p.image_url is null or p.image_url = '' or p.image_url ~ '(picsum\.photos|placehold\.co)');

update public.page_blocks
set style = jsonb_set(style, '{backgroundImageUrl}', to_jsonb(
    case type when 'hero' then '/img/hero.jpg' else '/img/banner-winter.jpg' end))
where style->>'backgroundImageUrl' ~ '(picsum\.photos|placehold\.co)';

update public.blog_posts
set cover_image_url = case slug
    when 'jak-dobrac-buty-trekkingowe'                  then '/img/blog-boots.jpg'
    when 'co-spakowac-do-plecaka-na-jednodniowa-wycieczke' then '/img/blog-backpack.jpg'
    when 'warstwowy-ubior-w-gorach'                     then '/img/blog-layers.jpg'
    when 'jak-dbac-o-sprzet-gorski'                     then '/img/blog-care.jpg'
    else '/img/product-default.jpg' end
where cover_image_url is null or cover_image_url = '' or cover_image_url ~ '(picsum\.photos|placehold\.co)';

-- ---------------------------------------------------------------------------
-- English translations (EN language switcher). Run last: it fills the *_en columns.
-- ---------------------------------------------------------------------------
alter table public.categories    add column if not exists name_en text;
alter table public.products      add column if not exists name_en text, add column if not exists description_en text;
alter table public.blog_posts    add column if not exists title_en text, add column if not exists excerpt_en text, add column if not exists content_en text;
alter table public.site_settings add column if not exists footer_text_en text;

-- Categories
update public.categories c set name_en = v.en
from (values
  ('Odzież górska', 'Mountain clothing'),
  ('Sprzęt wspinaczkowy', 'Climbing gear'),
  ('Plecaki i akcesoria', 'Backpacks & accessories'),
  ('Obuwie trekkingowe', 'Hiking footwear')
) as v(pl, en) where c.name = v.pl;

-- Products
update public.products p set name_en = v.name_en, description_en = v.desc_en
from (values
  ('Kurtka softshell Alpin', 'Alpin softshell jacket', 'Windproof, breathable jacket for changeable mountain weather'),
  ('Kurtka puchowa Summit', 'Summit down jacket', 'Lightweight down jacket for the coldest ascents and bivouacs'),
  ('Uprząż wspinaczkowa Vertex', 'Vertex climbing harness', 'Adjustable harness for rock climbing and via ferrata'),
  ('Czekan lodowcowy 60 cm', 'Glacier ice axe 60 cm', 'Lightweight aluminium ice axe for high-mountain hiking'),
  ('Raki 12-zębne', '12-point crampons', 'Versatile steel crampons for ice and firn'),
  ('Plecak trekkingowy 45 L', '45 L trekking backpack', 'Backpack with a carry system for multi-day mountain trips'),
  ('Plecak szturmowy 20 L', '20 L summit backpack', 'Compact backpack for day trips to the crags'),
  ('Kijki trekkingowe carbon', 'Carbon trekking poles', 'Pair of lightweight folding poles with cork grips'),
  ('Buty trekkingowe Ridge GTX', 'Ridge GTX hiking boots', 'Waterproof membrane boots for trails and via ferrata'),
  ('Buty zimowe Glacier', 'Glacier winter boots', 'Insulated high-mountain boots compatible with crampons')
) as v(pl, name_en, desc_en) where p.name = v.pl;

-- Footer
update public.site_settings
set footer_text_en = 'Szczyt — mountain and outdoor gear tested on the trail.'
where id = 1 and footer_text like 'Szczyt — sprzęt górski%';

-- Home page blocks: English overrides live in content.en (same shape as the Polish fields).
update public.page_blocks b
set content = b.content || jsonb_build_object('en', v.en::jsonb)
from public.pages pg,
(values
  (1, '{"title": "Gear that takes you to the summit", "subtitle": "Mountain clothing, footwear and equipment tested on the trail. Set out prepared.", "buttonText": "See what''s new"}'),
  (2, '{"html": "<div class=\"pb-usp\"><div><span>🚚</span><strong>Fast shipping</strong><p>Orders paid before 2 pm ship the same day.</p></div><div><span>↩️</span><strong>30-day returns</strong><p>Doesn''t fit? Send it back, no questions asked.</p></div><div><span>🛡️</span><strong>Manufacturer warranty</strong><p>Proven gear with a 2-year warranty.</p></div><div><span>🔒</span><strong>Secure payments</strong><p>BLIK, card and instant bank transfer via Przelewy24.</p></div></div>"}'),
  (3, '{"title": "Shop by category", "subtitle": "Everything you need for your expedition in one place"}'),
  (4, '{"title": "Featured products", "subtitle": "The newest and most popular picks this season"}'),
  (5, '{"title": "Winter season sale", "subtitle": "Up to 30% off selected down clothing and winter footwear", "buttonText": "See the deals"}'),
  (6, '{"html": "<h2>Gear chosen by people from the mountains</h2><p>Szczyt is a shop for those who prefer the trail to the couch: from a first trip to the Tatras to expeditions into higher mountains. We pick gear that works in rain, wind and frost, not just in photos.</p><ul><li>Clothing for every kind of weather: softshells, down, thermal base layers.</li><li>Climbing gear: harnesses, crampons, ice axes.</li><li>Backpacks, poles and camping accessories for one day or a whole week.</li></ul><p>Not sure what to choose? Ask the assistant in the chat in the bottom right corner or visit our <a href=\"/blog\">blog</a>.</p>"}'),
  (7, '{"title": "Tips for the trail and the crags", "subtitle": "How to choose boots, a backpack and clothing? Read our blog.", "buttonText": "Go to the blog"}')
) as v("order", en)
where pg.slug = 'home' and b.page_id = pg.id and b."order" = v."order";

-- Blog posts
update public.blog_posts set
  title_en = 'How to choose hiking boots: size, membrane and stiffness',
  excerpt_en = 'Boots are the most important piece of gear. Here is what to look for before you pick a pair for the trail.',
  content_en = '<p>Badly chosen boots can ruin even the best trip. Before you pick a pair, think about where and how often you will wear them.</p>
<h2>1. Size and fit</h2>
<p>Try boots on in the evening, when your foot is most swollen, and with the socks you will hike in. Leave about 1 cm of room in front of your toes so they do not hit the toe cap on descents. Your heel should not lift as you step.</p>
<h2>2. Cuff height</h2>
<ul><li><strong>Low (approach shoes):</strong> light, for dry trails and shorter routes.</li><li><strong>Mid:</strong> all-round, good ankle support, work well in the Tatras in summer.</li><li><strong>High:</strong> for harder terrain, heavy packs and winter.</li></ul>
<h2>3. Membrane</h2>
<p>A membrane (e.g. GTX) keeps water out but is less breathable. In heat and on dry trails it can be unnecessary; in changeable weather and mud it is very useful.</p>
<h2>4. Sole stiffness</h2>
<p>The harder the terrain and the heavier the pack, the stiffer the sole should be. In winter and for crampons you need a model designed for them.</p>
<p>Break new boots in on a few short walks before the trip. Looking for a specific model? See <a href="/products">our hiking footwear</a> or ask the assistant in the chat.</p>'
where slug = 'jak-dobrac-buty-trekkingowe';

update public.blog_posts set
  title_en = 'What to pack for a day hike in the mountains',
  excerpt_en = 'A list of things worth carrying even when the forecast looks great.',
  content_en = '<p>Mountain weather changes fast, so a day pack should be ready for more than just a walk. A 20–30 litre pack is enough for most trips.</p>
<h2>The basics</h2>
<ul><li>water (at least 1.5 l) and extra food, e.g. bars, nuts, sandwiches,</li><li>a thin rain jacket, even with a good forecast,</li><li>an extra layer: fleece or a light down jacket,</li><li>a hat and gloves outside summer, sunglasses and sunscreen in summer,</li><li>a map or an offline map app, a charged phone and a power bank.</li></ul>
<h2>Safety</h2>
<ul><li>a headlamp with spare batteries, because a descent can take longer than planned,</li><li>a small first-aid kit and an emergency foil blanket,</li><li>a whistle and the mountain emergency number: <strong>985</strong> or <strong>601 100 300</strong>.</li></ul>
<h2>How to pack it</h2>
<p>Keep heavy items close to your back, around the middle of the pack. Put what you may need quickly (jacket, snack) on top or in a side pocket. Adjust the hip belt so the weight rests on your hips, not your shoulders.</p>
<p>Browse the <a href="/products">backpacks and accessories</a> in our range.</p>'
where slug = 'co-spakowac-do-plecaka-na-jednodniowa-wycieczke';

update public.blog_posts set
  title_en = 'Layering in the mountains: three layers that work',
  excerpt_en = 'Why one thick jacket is a bad idea and how to dress for changeable weather.',
  content_en = '<p>In the mountains the temperature changes with altitude and effort. Instead of one thick jacket, a layering system works better, one you can take off and put on while walking.</p>
<h2>Layer 1: thermal base layer</h2>
<p>It sits against the skin and wicks sweat away. Avoid cotton: it soaks up water, dries slowly and chills fast. Synthetics or merino wool work well.</p>
<h2>Layer 2: insulation</h2>
<p>Fleece, a light down or synthetic jacket. Its job is to retain heat. Down is light and very warm but loses its properties when wet, so it suits breaks and cold days.</p>
<h2>Layer 3: wind and rain protection</h2>
<p>A softshell protects from wind and light rain and is breathable. For longer rain you need a membrane jacket.</p>
<h2>Rule of thumb</h2>
<p>Take a layer off before you start sweating and put one on before you get cold. On the ascent you usually need less; at a break add a warm layer.</p>
<p>See the <a href="/products">mountain clothing</a> in our shop.</p>'
where slug = 'warstwowy-ubior-w-gorach';

update public.blog_posts set
  title_en = 'How to care for mountain gear so it lasts for years',
  excerpt_en = 'Washing jackets, drying boots and storage: simple habits that extend the life of your gear.',
  content_en = '<p>Good gear is an investment, and a few simple habits will let you use it much longer.</p>
<h2>Jackets and clothing</h2>
<ul><li>Wash according to the label, preferably with a detergent made for technical clothing and without fabric softener.</li><li>Membranes and water repellency weaken over time. Re-proof when water stops beading.</li><li>Store down jackets loosely, not squashed in a compression sack.</li></ul>
<h2>Boots</h2>
<ul><li>After a trip, clean off the mud and dry them at room temperature, away from radiators and fire.</li><li>Remove the insoles so they dry faster.</li><li>Condition the leather and re-proof the boots from time to time.</li></ul>
<h2>Climbing gear</h2>
<ul><li>Keep rope, harness and slings in a dry, dark place, away from chemicals and sharp edges.</li><li>Check their condition before every use and follow the manufacturer''s retirement guidelines.</li></ul>
<p>Questions about a specific product? Ask the assistant in the chat.</p>'
where slug = 'jak-dbac-o-sprzet-gorski';

-- English chat texts
alter table public.faqs            add column if not exists question_en text, add column if not exists answer_en text;
alter table public.chatbot_settings add column if not exists welcome_message_en text;

-- New column goes last, so CREATE OR REPLACE is allowed.
create or replace view public.chatbot_public_settings as
  select enabled, welcome_message, welcome_message_en from public.chatbot_settings where id = 1;
grant select on public.chatbot_public_settings to anon, authenticated;

update public.chatbot_settings
set welcome_message_en = 'Hi! I''m the Szczyt assistant 🏔️. How can I help?'
where id = 1 and welcome_message_en is null;

update public.faqs f set question_en = v.q, answer_en = v.a
from (values
  ('Jak długo trwa dostawa?', 'How long does delivery take?', 'Standard courier delivery takes 1–3 business days from dispatch.'),
  ('Ile kosztuje wysyłka?', 'How much does shipping cost?', 'The shipping cost is shown when you place the order.'),
  ('Czy mogę zwrócić produkt?', 'Can I return a product?', 'Yes — you have 30 days to return it without giving a reason, in line with consumer law. The product must be unused and in its original packaging.'),
  ('Jak dobrać rozmiar butów trekkingowych?', 'How do I choose my hiking boot size?', 'Measure your foot in the evening and leave about 1 cm of room for your toes. For winter boots, consider going half a size up.'),
  ('Jakie metody płatności akceptujecie?', 'Which payment methods do you accept?', 'Payments are handled by Przelewy24: BLIK, card and instant bank transfer.'),
  ('Jak sprawdzić status zamówienia?', 'How do I check my order status?', 'Log in and open "My account" — you will see your order history and statuses.')
) as v(pl, q, a) where f.question = v.pl;
