# API Documentation

## `POST /api/stripe/checkout`

Creates a Stripe Checkout session for a logged-in user.

Request:

```json
{
  "planId": "growth",
  "interval": "monthly"
}
```

Response:

```json
{
  "url": "https://checkout.stripe.com/..."
}
```

Validation:

- `planId`: enabled premium plan id.
- `interval`: `monthly` or `yearly`.

Security:

- Requires an auth session.
- Uses server-side Stripe secret key only.
- Upserts the user profile in MySQL using `Profile.externalAuthId`.
- Adds user, plan, and interval metadata to the Stripe subscription.

## `POST /api/stripe/portal`

Creates a Stripe billing portal session.

Response:

```json
{
  "url": "https://billing.stripe.com/..."
}
```

Security:

- Requires an auth session.
- Reads the latest Stripe customer id from the MySQL `Subscription` table.

## `POST /api/stripe/webhook`

Handles Stripe events.

Events:

- `checkout.session.completed`: upserts MySQL `Profile` and `Subscription` records.
- `customer.subscription.updated`: updates subscription status and billing period.
- `customer.subscription.deleted`: updates subscription status and cancellation state.
- `invoice.payment_failed`: records failed invoice in MySQL `Payment`.
- `invoice.payment_succeeded`: records successful invoice in MySQL `Payment`.

Security:

- Verifies `stripe-signature` with `STRIPE_WEBHOOK_SECRET`.
- Persists data through Prisma using `DATABASE_URL`.

## MySQL Data Access

Server-side data access uses Prisma from [lib/db/prisma.ts](/Users/root1/Documents/Codex/2026-05-11/you-are-a-world-class-senior/lib/db/prisma.ts).

Important models:

- `Profile`
- `Tool`
- `Category`
- `Review`
- `Discussion`
- `Comment`
- `PremiumPlan`
- `Subscription`
- `Payment`
- `WebsiteSetting`
- `MediaAsset`
- `CreatorProfile`
- `FounderProfile`
- `SocialAccount`
- `AffiliateLink`
- `CreatorEarning`
