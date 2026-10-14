/**
 * Public base URL of the site, used as the target of links in e-mails.
 *
 * Without an explicit redirect target Supabase falls back to the project's
 * "Site URL" setting, which defaults to http://localhost:3000 — that is why
 * confirmation links used to open localhost. We always pass an explicit URL:
 *  - VITE_SITE_URL when set (recommended for production builds),
 *  - otherwise the origin the app is currently served from.
 *
 * The URL must also be listed under Authentication -> URL Configuration ->
 * Redirect URLs in the Supabase dashboard, otherwise Supabase ignores it.
 */
export function siteUrl(): string {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  const base = configured || window.location.origin;
  return base.replace(/\/+$/, '');
}
