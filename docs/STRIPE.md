# Stripe Setup

## Products

Create products:

- Starter
- Growth
- Pro
- Authority

Each product needs monthly and yearly recurring prices.

## Premium Plans Table

Update:

- `stripe_product_id`
- `stripe_monthly_price_id`
- `stripe_yearly_price_id`

These values are used by `/api/stripe/checkout`.

The plan records live in MySQL as `PremiumPlan` rows.

## Billing Features

Implemented:

- Stripe Checkout
- Recurring subscriptions
- Billing portal
- Webhook verification
- Failed payment records
- Successful payment records
- Plan upgrades and downgrades through billing portal
- Cancellation tracking
- Invoice URL and PDF storage
- Coupon support through `allow_promotion_codes`
- Automatic tax support
- Usage JSON field on subscriptions

Webhook writes are handled by Prisma and persisted to MySQL:

- `Subscription`
- `Payment`

## Webhook Events

Configure:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.payment_succeeded`
