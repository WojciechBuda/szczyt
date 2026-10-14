-- 0004 · CMS: footer links, page builder, blog, FAQ and support-chat settings.

create table public.social_links (
  id          integer generated always as identity primary key,
  platform    text not null,
  url         text not null,
  "order"     integer not null default 0,
  is_visible  boolean not null default true
);

-- Page builder: any number of pages, each an ordered list of typed blocks.
-- Blocks carry type-specific `content` and a shared `style` envelope.
-- Admins pick from a fixed palette of block types; arbitrary scripts are not stored.
create table public.pages (
  id          integer generated always as identity primary key,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title       text not null,
  is_system   boolean not null default false,   -- the 'home' page cannot be deleted
  created_at  timestamptz not null default now()
);

create table public.page_blocks (
  id          integer generated always as identity primary key,
  page_id     integer not null references public.pages(id) on delete cascade,
  type        text not null check (type in ('hero', 'rich_text', 'gallery', 'categories', 'featured_products', 'banner')),
  "order"     integer not null default 0,
  is_visible  boolean not null default true,
  content     jsonb not null default '{}'::jsonb,  -- e.g. {"title": "...", "buttonLink": "/products"}
  style       jsonb not null default '{}'::jsonb   -- {"backgroundColor", "backgroundImageUrl", "textColor", "fontFamily", "paddingSize"}
);
create index page_blocks_page_idx on public.page_blocks (page_id, "order");

create table public.blog_posts (
  id               integer generated always as identity primary key,
  slug             text not null unique,
  title            text not null,
  excerpt          text not null default '',
  cover_image_url  text,
  content          text not null default '',      -- HTML, written by admins only
  author_name      text not null default 'Szczyt',
  is_published     boolean not null default false,
  published_at     timestamptz,
  created_at       timestamptz not null default now()
);

create table public.faqs (
  id          integer generated always as identity primary key,
  question    text not null,
  answer      text not null,
  "order"     integer not null default 0,
  is_visible  boolean not null default true
);

create table public.chatbot_settings (
  id               integer primary key default 1,
  enabled          boolean not null default true,
  provider         text not null default 'anthropic' check (provider in ('anthropic', 'openai')),
  model            text not null default 'claude-haiku-5-5',
  system_prompt    text not null default '',
  welcome_message  text not null default 'Cześć! W czym mogę pomóc?',
  constraint chatbot_settings_singleton check (id = 1)
);

-- The widget only needs these two columns; the system prompt stays admin-only.
create view public.chatbot_public_settings as
  select enabled, welcome_message from public.chatbot_settings where id = 1;
grant select on public.chatbot_public_settings to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.social_links      enable row level security;
alter table public.pages             enable row level security;
alter table public.page_blocks       enable row level security;
alter table public.blog_posts        enable row level security;
alter table public.faqs              enable row level security;
alter table public.chatbot_settings  enable row level security;

create policy social_links_select on public.social_links for select using (is_visible or public.is_admin());
create policy social_links_insert on public.social_links for insert with check (public.is_admin());
create policy social_links_update on public.social_links for update using (public.is_admin());
create policy social_links_delete on public.social_links for delete using (public.is_admin());

create policy pages_select on public.pages for select using (true);
create policy pages_insert on public.pages for insert with check (public.is_admin());
create policy pages_update on public.pages for update using (public.is_admin());
create policy pages_delete on public.pages for delete using (public.is_admin() and not is_system);

create policy page_blocks_select on public.page_blocks for select using (is_visible or public.is_admin());
create policy page_blocks_insert on public.page_blocks for insert with check (public.is_admin());
create policy page_blocks_update on public.page_blocks for update using (public.is_admin());
create policy page_blocks_delete on public.page_blocks for delete using (public.is_admin());

create policy blog_posts_select on public.blog_posts for select using (is_published or public.is_admin());
create policy blog_posts_insert on public.blog_posts for insert with check (public.is_admin());
create policy blog_posts_update on public.blog_posts for update using (public.is_admin());
create policy blog_posts_delete on public.blog_posts for delete using (public.is_admin());

create policy faqs_select on public.faqs for select using (is_visible or public.is_admin());
create policy faqs_insert on public.faqs for insert with check (public.is_admin());
create policy faqs_update on public.faqs for update using (public.is_admin());
create policy faqs_delete on public.faqs for delete using (public.is_admin());

create policy chatbot_settings_select on public.chatbot_settings for select using (public.is_admin());
create policy chatbot_settings_insert on public.chatbot_settings for insert with check (public.is_admin());
create policy chatbot_settings_update on public.chatbot_settings for update using (public.is_admin());
