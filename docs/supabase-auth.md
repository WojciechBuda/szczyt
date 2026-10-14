# Supabase Auth: e-mail confirmation links

The confirmation e-mail contains a link built by Supabase. Where it points is decided by two things:

1. The `emailRedirectTo` passed by the app (`/auth/confirmed` on the current origin or on `VITE_SITE_URL`).
2. The **allow-list** in the dashboard. If the requested URL is not on the list, Supabase silently falls back to the **Site URL** — which is `http://localhost:3000` on a new project. That is why links used to open localhost.

## Dashboard configuration (once per project)

*Authentication → URL Configuration*

| Field | Value |
| --- | --- |
| **Site URL** | your production URL, e.g. `https://shop.example.workers.dev` |
| **Redirect URLs** | `https://shop.example.workers.dev/**` and `http://localhost:5173/**` (for local development) |

Save, then register a new test account. E-mails that were sent **before** the change keep the old link; use *Wyślij ponownie* on the register/login page to get a fresh one.

## Optional: `VITE_SITE_URL`

By default the app uses `window.location.origin`, so preview deployments and localhost work without configuration. Set `VITE_SITE_URL` as a **build** variable if you serve the site on a custom domain and want links to always use it.

## Mail delivery limits

The built-in Supabase mailer is meant for testing: it is heavily rate limited (a couple of messages per hour) and may deliver only to addresses of project members. For real customers configure a custom SMTP provider under *Authentication → SMTP Settings* (Resend, Brevo, Postmark, …).

## Troubleshooting

- *Link still opens localhost* — Site URL or Redirect URLs not saved, or the e-mail was sent earlier.
- *"Email not confirmed" at login* — the user has not clicked the link yet; the login page offers to resend it.
- *No e-mail arrives* — check spam, then the rate limit / SMTP note above.
