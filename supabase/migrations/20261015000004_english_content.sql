-- 0004b · English translations of the demo content.
-- Adds optional *_en columns next to the Polish originals. The storefront shows the English text
-- when the visitor picked EN and falls back to Polish wherever a translation is missing, so rows
-- added later in the admin panel keep working without one.
-- Idempotent: safe to run more than once.

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
where id = 1 and footer_text_en is null;

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
