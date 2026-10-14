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
  ('Kurtka softshell Alpin',        'Wiatroszczelna i oddychająca kurtka na zmienną pogodę w górach', 429.00, 18, 'Odzież górska',        'https://picsum.photos/seed/jacket1/400/300'),
  ('Kurtka puchowa Summit',         'Lekka kurtka puchowa na najzimniejsze podejścia i biwaki',        599.00, 12, 'Odzież górska',        'https://picsum.photos/seed/jacket2/400/300'),
  ('Uprząż wspinaczkowa Vertex',    'Regulowana uprząż do wspinaczki skałkowej i via ferraty',         289.00, 20, 'Sprzęt wspinaczkowy',  'https://picsum.photos/seed/harness/400/300'),
  ('Czekan lodowcowy 60 cm',        'Lekki czekan aluminiowy do turystyki wysokogórskiej',             199.00, 15, 'Sprzęt wspinaczkowy',  'https://picsum.photos/seed/axe/400/300'),
  ('Raki 12-zębne',                 'Uniwersalne raki stalowe do lodu i firnu',                        349.00, 10, 'Sprzęt wspinaczkowy',  'https://picsum.photos/seed/crampons/400/300'),
  ('Plecak trekkingowy 45 L',       'Plecak z systemem nośnym na wielodniowe wyprawy górskie',         459.00, 22, 'Plecaki i akcesoria',  'https://picsum.photos/seed/backpack45/400/300'),
  ('Plecak szturmowy 20 L',         'Kompaktowy plecak na jednodniowe wyjścia w skałki',               199.00, 30, 'Plecaki i akcesoria',  'https://picsum.photos/seed/backpack20/400/300'),
  ('Kijki trekkingowe carbon',      'Para lekkich kijków składanych z gripem korkowym',                249.00, 25, 'Plecaki i akcesoria',  'https://picsum.photos/seed/poles/400/300'),
  ('Buty trekkingowe Ridge GTX',    'Wodoodporne buty z membraną na szlaki i via ferraty',             649.00, 14, 'Obuwie trekkingowe',   'https://picsum.photos/seed/boots1/400/300'),
  ('Buty zimowe Glacier',           'Ocieplane buty wysokogórskie kompatybilne z rakami',              899.00,  8, 'Obuwie trekkingowe',   'https://picsum.photos/seed/boots2/400/300')
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
  ('hero', 1, '{"title": "Sprzęt, który zabierze Cię na szczyt", "subtitle": "Odzież, obuwie i ekwipunek górski sprawdzony na szlaku. Wyrusz przygotowany.", "buttonText": "Zobacz nowości", "buttonLink": "/products"}'::jsonb, '{"backgroundColor": "#2f4a3c", "textColor": "#ffffff", "paddingSize": "lg", "backgroundImageUrl": "https://picsum.photos/seed/szczyt-hero/1600/700"}'::jsonb),
  ('rich_text', 2, '{"html": "<div class=\"pb-usp\"><div><span>🚚</span><strong>Szybka wysyłka</strong><p>Zamówienia opłacone do 14:00 wysyłamy tego samego dnia.</p></div><div><span>↩️</span><strong>30 dni na zwrot</strong><p>Nie pasuje? Zwróć bez podawania przyczyny.</p></div><div><span>🛡️</span><strong>Gwarancja producenta</strong><p>Sprawdzony sprzęt z 2-letnią gwarancją.</p></div><div><span>🔒</span><strong>Bezpieczne płatności</strong><p>BLIK, karta i szybki przelew przez Przelewy24.</p></div></div>", "wide": true}'::jsonb, '{"backgroundColor": "#ffffff", "paddingSize": "sm"}'::jsonb),
  ('categories', 3, '{"title": "Kupuj według kategorii", "subtitle": "Wszystko, czego potrzebujesz na wyprawę, w jednym miejscu"}'::jsonb, '{}'::jsonb),
  ('featured_products', 4, '{"title": "Polecane produkty", "subtitle": "Najnowsze i najchętniej wybierane w tym sezonie"}'::jsonb, '{}'::jsonb),
  ('banner', 5, '{"title": "Wyprzedaż sezonu zimowego", "subtitle": "Do -30% na wybraną odzież puchową i obuwie zimowe", "buttonText": "Zobacz promocje", "buttonLink": "/products"}'::jsonb, '{"backgroundColor": "#1f332a", "textColor": "#ffffff", "backgroundImageUrl": "https://picsum.photos/seed/mountainbanner/1200/400"}'::jsonb),
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
