-- 0006 · English texts for the support chat (welcome message and FAQ chips/answers).
-- The Edge Function also asks the model to answer in the visitor's language.
-- Idempotent: safe to run more than once.

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
