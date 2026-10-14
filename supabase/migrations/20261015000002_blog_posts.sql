-- 0007 · Starter blog posts (published). Re-running is safe: existing slugs are left untouched.
-- Content is general, non-medical advice; adjust it to your brand and offer in Admin -> Blog.

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
