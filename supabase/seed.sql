-- Demo content. Safe to run once on an empty database (`supabase db reset` runs it automatically).
-- No social links or contact e-mail are seeded on purpose — add real ones in Admin -> Stopka.

insert into public.categories (name, description) values
  ('Odzież górska', 'Kurtki, softshelle, termoaktywna bielizna'),
  ('Sprzęt wspinaczkowy', 'Uprzęże, liny, raki, czekany'),
  ('Plecaki i akcesoria', 'Plecaki trekkingowe, kije, akcesoria biwakowe'),
  ('Obuwie trekkingowe', 'Buty górskie, podejściowe i zimowe');

insert into public.products (name, description, price, stock, category_id, image_url)
select p.name, p.description, p.price, p.stock, c.id, p.image_url
from (values
  ('Kurtka softshell Alpin',        'Wiatroszczelna i oddychająca kurtka na zmienną pogodę w górach', 429.00, 18, 'Odzież górska',        '/img/product-clothing.jpg'),
  ('Kurtka puchowa Summit',         'Lekka kurtka puchowa na najzimniejsze podejścia i biwaki',        599.00, 12, 'Odzież górska',        '/img/product-clothing.jpg'),
  ('Uprząż wspinaczkowa Vertex',    'Regulowana uprząż do wspinaczki skałkowej i via ferraty',         289.00, 20, 'Sprzęt wspinaczkowy',  '/img/product-climbing.jpg'),
  ('Czekan lodowcowy 60 cm',        'Lekki czekan aluminiowy do turystyki wysokogórskiej',             199.00, 15, 'Sprzęt wspinaczkowy',  '/img/product-climbing.jpg'),
  ('Raki 12-zębne',                 'Uniwersalne raki stalowe do lodu i firnu',                        349.00, 10, 'Sprzęt wspinaczkowy',  '/img/product-climbing.jpg'),
  ('Plecak trekkingowy 45 L',       'Plecak z systemem nośnym na wielodniowe wyprawy górskie',         459.00, 22, 'Plecaki i akcesoria',  '/img/product-backpacks.jpg'),
  ('Plecak szturmowy 20 L',         'Kompaktowy plecak na jednodniowe wyjścia w skałki',               199.00, 30, 'Plecaki i akcesoria',  '/img/product-backpacks.jpg'),
  ('Kijki trekkingowe carbon',      'Para lekkich kijków składanych z gripem korkowym',                249.00, 25, 'Plecaki i akcesoria',  '/img/product-backpacks.jpg'),
  ('Buty trekkingowe Ridge GTX',    'Wodoodporne buty z membraną na szlaki i via ferraty',             649.00, 14, 'Obuwie trekkingowe',   '/img/product-boots.jpg'),
  ('Buty zimowe Glacier',           'Ocieplane buty wysokogórskie kompatybilne z rakami',              899.00,  8, 'Obuwie trekkingowe',   '/img/product-boots.jpg')
) as p(name, description, price, stock, category, image_url)
join public.categories c on c.name = p.category;

insert into public.site_settings (id, footer_text, contact_email) values
  (1, 'Szczyt — sprzęt górski i outdoorowy sprawdzony na szlaku.', null);

-- Home page = ordered blocks
insert into public.pages (slug, title, is_system) values ('home', 'Strona główna', true);

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

insert into public.faqs (question, answer, "order") values
  ('Jak długo trwa dostawa?', 'Standardowa dostawa kurierem trwa 1–3 dni robocze od momentu nadania.', 1),
  ('Ile kosztuje wysyłka?', 'Koszt wysyłki jest widoczny przy składaniu zamówienia.', 2),
  ('Czy mogę zwrócić produkt?', 'Tak — masz 30 dni na zwrot bez podania przyczyny, zgodnie z prawem konsumenckim. Produkt powinien być nieużywany i w oryginalnym opakowaniu.', 3),
  ('Jak dobrać rozmiar butów trekkingowych?', 'Mierz stopę wieczorem i zostaw ok. 1 cm luzu na palce. Przy butach zimowych warto wziąć pół numeru większe.', 4),
  ('Jakie metody płatności akceptujecie?', 'Płatności obsługuje Przelewy24: BLIK, karta i szybki przelew.', 5),
  ('Jak sprawdzić status zamówienia?', 'Po zalogowaniu wejdź w „Moje konto” — zobaczysz historię zamówień i ich statusy.', 6);

insert into public.chatbot_settings (id, enabled, provider, model, system_prompt, welcome_message) values (
  1, true, 'anthropic', 'claude-haiku-5-5',
  'Jesteś pomocnym asystentem obsługi klienta sklepu internetowego „Szczyt” ze sprzętem górskim i outdoorowym. Odpowiadaj krótko, konkretnie i uprzejmie, po polsku. Opieraj się przede wszystkim na dostarczonych pytaniach i odpowiedziach FAQ. Jeśli nie znasz odpowiedzi albo pytanie dotyczy konkretnego zamówienia klienta, uprzejmie poinformuj, że najlepiej skontaktować się ze sklepem — nie zmyślaj szczegółów, których nie znasz.',
  'Cześć! Jestem asystentem Szczyt 🏔️. W czym mogę pomóc?'
);

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

-- ---------------------------------------------------------------------------
-- English translations of the demo content above (same statements as
-- migrations/20261015000004_english_content.sql, which runs BEFORE this seed on a fresh database).
-- ---------------------------------------------------------------------------
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

-- English chat texts (same as migrations/20261016000001_chat_english.sql, which runs before this seed).
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
