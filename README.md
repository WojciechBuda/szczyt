# Szczyt

Online shop for mountain and outdoor gear (Polish UI). Customers browse, pay through Przelewy24 and track orders; admins manage products, orders, pages, blog, footer and the AI support chat from `/admin`.

| Layer | Tech |
| --- | --- |
| Frontend | React 18, TypeScript, Vite 5, React Router, zustand |
| Backend | Supabase: Postgres + Row Level Security, Auth, Storage, Edge Functions (Deno) |
| Payments | Przelewy24 (REST v1, SHA-384 signed) |
| AI chat | Anthropic or OpenAI, called from an Edge Function |
| Hosting | Cloudflare Workers static assets |

## Repository layout

```
frontend/shop-web/   React app (src/api, src/components, src/pages, src/store, ...)
supabase/
  migrations/        schema, RLS, RPCs, CMS tables, storage (apply in filename order)
  functions/         chat-support, p24-create-payment, p24-webhook, _shared
  seed.sql           demo catalogue, home page, FAQ, chatbot defaults
  config.toml        Supabase CLI config (verify_jwt = false, see below)
docs/                focused how-tos
```

## Local development

Requirements: Node 20+, a Supabase project (or the [Supabase CLI](https://supabase.com/docs/guides/local-development) for a local stack).

```bash
# 1. database
supabase link --project-ref <ref>
supabase db push                      # applies supabase/migrations
psql "$DATABASE_URL" -f supabase/seed.sql   # optional demo data (empty DB only)

# 2. frontend
cd frontend/shop-web
cp .env.example .env                  # fill in URL + publishable key
npm ci
npm run dev                           # http://localhost:5173
```

`npm run build` type-checks (`tsc -b`) and produces `dist/`.

## Configuration

| Variable | Where | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | frontend **build** env | Publishable key only. Vite inlines them at build time, so on Cloudflare add them as *build* variables and rebuild. |
| `VITE_SITE_URL` | frontend build env, optional | Target for e-mail links; defaults to the current origin. |
| `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | `supabase secrets set` | Chat provider key. Never in the frontend. |
| `P24_MERCHANT_ID`, `P24_POS_ID`, `P24_CRC`, `P24_API_KEY`, `P24_SANDBOX`, `SITE_URL` | `supabase secrets set` | Przelewy24 credentials; `P24_SANDBOX=false` in production. |

`.env` files are git-ignored. The service-role / secret key is used only inside Edge Functions.

## Deploying

**Edge Functions**

```bash
supabase functions deploy chat-support
supabase functions deploy p24-create-payment
supabase functions deploy p24-webhook
```

`supabase/config.toml` sets `verify_jwt = false` for all three: the browser sends the new publishable key (not a JWT), and the Przelewy24 webhook has no Supabase token at all. Each function authorizes the caller itself (user token check, payment signature check). If chat returns an error, check the function logs, the `ANTHROPIC_API_KEY` secret and that the model in *Admin → Czat wsparcia* is current (default `claude-haiku-5-5`).

**Frontend on Cloudflare (Workers Builds)**

- Root directory: `frontend/shop-web`
- Build command: `npm run build` · Deploy command: `npx wrangler deploy`
- Build variables: the two `VITE_*` values above
- `wrangler.jsonc` serves `dist/` with SPA fallback. Do **not** add `public/_redirects` — it conflicts and fails the deploy.

**Auth e-mail links** must be allow-listed in Supabase, otherwise they point to localhost: see [docs/supabase-auth.md](docs/supabase-auth.md).

## First admin

Register in the app, then in the Supabase SQL editor:

```sql
update public.profiles set role = 'Admin'
where id = (select id from auth.users where email = 'you@example.com');
```

Sign out and in again. Customers cannot change their own role (column-level grant, see migration 0002).

## Security notes

- RLS on every table; orders, order items and payments are written only by `SECURITY DEFINER` functions / Edge Functions.
- `create_order` re-reads prices and stock on the server; the client never sends prices.
- Rich text and blog HTML are admin-authored and rendered as-is. Do not grant the Admin role to untrusted users.
- **Existing database created from older scripts?** Do not run the migrations; run [docs/upgrade-existing-database.sql](docs/upgrade-existing-database.sql) once instead (idempotent). It adds the page-builder/blog tables, hardens security and refreshes the home page. The minimal hardening only:

```sql
drop function if exists public.pay_order(integer, text);
revoke update on public.profiles from anon, authenticated;
grant update (first_name, last_name) on public.profiles to authenticated;
```

## Responsive design

Breakpoints: 900px (hamburger navigation), 768px (tablet: single-column pages, 16px fields), 600px/480px (phone: two-column products, card-style cart, bottom-sheet chat). Controls are 44px on touch devices. Admin page-builder blocks can be reordered with ↑/↓ buttons because HTML5 drag-and-drop does not work on touch screens.

## Branching and commits

Work is done on topic branches (`frontend`, `backend`, `fix/*`, `feature/*`, `docs/*`) and merged into `main` with `--no-ff`. Commit messages are in English and follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat(web): …`, `fix(auth): …`, `feat(db): …`).
