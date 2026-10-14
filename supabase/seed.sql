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
