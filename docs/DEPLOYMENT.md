# Deployment Guide

For VPS deployment with Docker, MySQL, and Nginx, use [VPS_DEPLOYMENT.md](/Users/root1/Documents/Codex/2026-05-11/you-are-a-world-class-senior/docs/VPS_DEPLOYMENT.md).

## Vercel

1. Import the repository into Vercel.
2. Add all values from `.env.example`.
3. Set `NEXT_PUBLIC_APP_URL` to the public production domain.
4. Set `NEXT_PUBLIC_ADMIN_URL` to the admin subdomain.
5. Set `ADMIN_SUBDOMAIN_HOST` to the admin host, for example `admin.yourdomain.com`.
6. Deploy with `npm run build`.

## MySQL

Use a managed MySQL 8 provider such as PlanetScale, AWS RDS, Neon MySQL-compatible offerings, Railway, Render, or a private MySQL cluster.

Run:

```bash
npm run db:generate
npm run db:migrate
```

For local development without migration files:

```bash
npm run db:push
```

## Admin Subdomain

Point `admin.yourdomain.com` at the same Vercel project and set:

```bash
ADMIN_SUBDOMAIN_HOST=admin.yourdomain.com
NEXT_PUBLIC_ADMIN_URL=https://admin.yourdomain.com
```

Middleware rewrites admin-host traffic to `/admin`. The admin route uses its own shell without the public header/footer, so it can be deployed as a subdomain while sharing the same codebase.

## Supabase Auth

Supabase is optional for Auth and Storage only. If enabled:

1. Configure Email/password, Google, GitHub, and Twitter/X providers.
2. Add redirect URLs:
   - `https://yourdomain.com/auth/callback`
   - `https://admin.yourdomain.com/auth/callback`
3. Keep application data in MySQL through Prisma.

## Stripe

Create live products and recurring prices:

- Starter: `$29/month`, yearly `$290/year`
- Growth: `$99/month`, yearly `$990/year`
- Pro: `$299/month`, yearly `$2990/year`
- Authority: `$999/month`, yearly `$9990/year`

Update the MySQL `PremiumPlan` table with live product and price IDs.

## Analytics

PostHog:

- Set `NEXT_PUBLIC_POSTHOG_KEY`.
- Set `NEXT_PUBLIC_POSTHOG_HOST`.

Plausible:

- Set `PLAUSIBLE_DOMAIN`.
- Add the Plausible script in `app/layout.tsx` if Plausible is selected in `WebsiteSetting`.

## First Admin

After signing up, promote your account:

```sql
update Profile set role = 'admin', isVerified = true where email = 'you@company.com';
```
