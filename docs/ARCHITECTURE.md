# Architecture

## App Structure

```text
app/
  api/stripe/*          Stripe checkout, portal, and webhook routes
  auth/*                Optional Supabase auth callback and login
  categories/[slug]     Programmatic SEO category pages
  tools/[slug]          Tool profile pages
  admin                 Enterprise admin console for admin subdomain
  creator/dashboard     Creator economy dashboard
  founder/dashboard     Founder dashboard
  sitemap.ts            Dynamic sitemap
  robots.ts             Dynamic robots.txt
  rss.xml/route.ts      RSS feed
components/
  admin                 Admin console modules
  auth                  Auth UI
  directory             Search/filter/tool cards
  home                  Homepage system
  layout                Public shell and admin-aware app shell
  providers             Theme and React Query
  tool                  Tool profile system
  ui                    ShadCN-style primitives
database/mysql          Audited MySQL SQL reference
prisma/schema.prisma    MySQL source-of-truth schema
lib/
  db                    Prisma client
  analytics             PostHog event helper
  auth                  Role permission helpers
  queries               Server query adapters
  seo                   Structured data
  stripe                Stripe helpers
  supabase              Optional auth/storage clients
  utils                 Ranking and class utilities
  validation            Zod schemas
store/                  Zustand client state
types/                  Domain and database types
```

## Runtime Model

- Public pages are static or server-rendered where SEO matters.
- Tool and category pages emit dynamic metadata, canonical URLs, OpenGraph, Twitter cards, and JSON-LD.
- Client components are used for live filtering, theme switching, bookmarks, tabs, auth forms, and admin interaction.
- MySQL is the system of record for application data.
- Prisma is the server-side database access layer.
- Supabase is optional for Auth and Storage only.
- Stripe webhooks write subscription and payment state to MySQL.

## Admin Subdomain

`middleware.ts` checks the host:

- `ADMIN_SUBDOMAIN_HOST=admin.yourdomain.com`
- Requests to that host are rewritten to `/admin`.
- `/admin` uses `AppShell` without the public header/footer.

This lets the admin panel deploy on a subdomain while sharing the same Vercel project and codebase.

## Scaling Notes

- Replace `data/catalog.ts` with Prisma queries as production data grows.
- Use scheduled jobs to snapshot `Ranking` rows daily or hourly.
- Move AI review summaries and fake-review scoring into queued server jobs.
- Add CDN image transformations for uploaded media.
- Use PostHog cohorts or warehouse exports for creator attribution and paid placement analytics.
