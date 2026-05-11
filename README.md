# TheAiStack

TheAiStack is a production-oriented AI directory, review, creator, founder analytics, media, ranking, and subscription ecosystem built with Next.js 15, TypeScript, TailwindCSS, ShadCN-style components, Framer Motion, Zustand, React Query, MySQL, Prisma, Stripe, Vercel, and PostHog/Plausible-ready analytics.

The current visual direction is minimalistic: black, grey, white, and a pinkish-red accent.

## What Is Included

- Minimal responsive homepage with advanced search, trending tools, featured tools, top-rated tools, creator spotlight, featured reviews, news, launches, newsletter CTA, statistics, testimonials, and footer.
- AI tool directory with live search, filters, sorting, verified tools, bookmarking, category SEO pages, ranking modes, and load-more browsing.
- Tool profile pages with screenshots, pricing, categories, features, founder info, affiliate/social links, reviews, discussions, videos, alternatives, FAQs, updates, OpenGraph, Twitter cards, and schema markup.
- MySQL data model for users, profiles, tools, categories, reviews, discussions, subscriptions, payments, plans, website settings, media assets, creators, founders, notifications, analytics, rankings, bookmarks, updates, social accounts, affiliate links, and creator earnings.
- Optional Supabase Auth-ready login with email/password, Google, GitHub, and X/Twitter OAuth.
- Creator dashboard, founder dashboard, and a separate admin surface deployable on an admin subdomain.
- Stripe Checkout, billing portal route, webhook route, subscription lifecycle handling, invoices, failed/successful payment records, coupon support, and tax support.
- SEO system with dynamic metadata, sitemap, robots, RSS feed, canonical URLs, structured data, category pages, and ranking landing pages.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run db:generate
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://admin.localhost:3000
ADMIN_SUBDOMAIN_HOST=admin.localhost
DATABASE_URL="mysql://theaistack:password@localhost:3306/theaistack"

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_DEFAULT_TAX_RATE_ID=

NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
PLAUSIBLE_DOMAIN=
RATE_LIMIT_SECRET=
CRON_SECRET=
```

## MySQL Setup

1. Create a MySQL 8 database.
2. Set `DATABASE_URL`.
3. Run `npm run db:generate`.
4. Run `npm run db:push` locally or `npm run db:migrate` in production.
5. See [docs/MYSQL.md](/Users/root1/Documents/Codex/2026-05-11/you-are-a-world-class-senior/docs/MYSQL.md).

## VPS Deployment

Use the VPS guide when deploying to your own server with Docker, MySQL, and Nginx:

- [docs/VPS_DEPLOYMENT.md](/Users/root1/Documents/Codex/2026-05-11/you-are-a-world-class-senior/docs/VPS_DEPLOYMENT.md)
- [docker-compose.prod.yml](/Users/root1/Documents/Codex/2026-05-11/you-are-a-world-class-senior/docker-compose.prod.yml)
- [.env.production.example](/Users/root1/Documents/Codex/2026-05-11/you-are-a-world-class-senior/.env.production.example)

## Admin Subdomain

Point `admin.yourdomain.com` at the same Vercel project and set:

```bash
ADMIN_SUBDOMAIN_HOST=admin.yourdomain.com
NEXT_PUBLIC_ADMIN_URL=https://admin.yourdomain.com
```

Middleware rewrites admin-host traffic to `/admin`; the admin route uses a separate shell without the public header/footer.

## Stripe Setup

1. Create Stripe products and recurring prices for Starter, Growth, Pro, and Authority.
2. Put the real product and price IDs into the MySQL `PremiumPlan` table or manage them through the admin console.
3. Create webhook endpoint: `/api/stripe/webhook`.
4. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. Add `STRIPE_WEBHOOK_SECRET` to Vercel.

## Production Hardening Checklist

- Replace seeded Stripe product and price IDs with live Stripe IDs.
- Create the first admin user by setting `Profile.role = 'admin'` in MySQL.
- Add PostHog or Plausible script configuration.
- Configure rate limits at Vercel Edge.
- Add transactional email provider for newsletter, billing, and notifications.
- Add Sentry or equivalent error monitoring.
- Add real AI moderation/summarization functions for review summaries and fake-review detection.
