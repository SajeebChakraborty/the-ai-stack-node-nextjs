# VPS Deployment Guide

This guide deploys TheAiStack on one VPS with Docker, MySQL, and Nginx.

## 1. Details You Need Before Deployment

Prepare these values:

- Public domain: `yourdomain.com`
- Admin subdomain: `admin.yourdomain.com`
- VPS IP address
- SSH user with sudo access
- MySQL app password
- MySQL root password
- Supabase project URL and anon key if using real Google OAuth
- Stripe publishable key, secret key, and webhook secret
- PostHog or Plausible analytics details
- Two random secrets for `RATE_LIMIT_SECRET` and `CRON_SECRET`

Production Google login requires Supabase Auth configured with Google OAuth. Without Supabase env vars, the local demo Google login is only for preview and should not be used as production auth.

## 2. DNS Records

Create A records:

```text
yourdomain.com        A    VPS_IP
www.yourdomain.com    A    VPS_IP
admin.yourdomain.com  A    VPS_IP
```

## 3. VPS Packages

On Ubuntu:

```bash
sudo apt update
sudo apt install -y git nginx certbot python3-certbot-nginx docker.io docker-compose-plugin
sudo systemctl enable --now docker nginx
sudo usermod -aG docker $USER
```

Log out and back in after adding your user to the Docker group.

## 4. Upload Code

```bash
git clone YOUR_REPO_URL /var/www/theaistack
cd /var/www/theaistack
cp .env.production.example .env.production
```

Edit `.env.production`.

Minimum required:

```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ADMIN_URL=https://admin.yourdomain.com
ADMIN_SUBDOMAIN_HOST=admin.yourdomain.com
DATABASE_URL="mysql://theaistack:YOUR_PASSWORD@mysql:3306/theaistack"
MYSQL_PASSWORD=YOUR_PASSWORD
MYSQL_ROOT_PASSWORD=YOUR_ROOT_PASSWORD
```

For real login:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

For billing:

```bash
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 5. Build And Start

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Check logs:

```bash
docker compose -f docker-compose.prod.yml logs -f app
```

## 6. Create MySQL Tables

For first deployment:

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma db push
```

For migration-based production later:

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

## 7. Nginx

Copy the sample config:

```bash
sudo cp deploy/nginx/theaistack.conf /etc/nginx/sites-available/theaistack.conf
sudo sed -i 's/yourdomain.com/YOUR_DOMAIN/g' /etc/nginx/sites-available/theaistack.conf
sudo ln -s /etc/nginx/sites-available/theaistack.conf /etc/nginx/sites-enabled/theaistack.conf
sudo nginx -t
sudo systemctl reload nginx
```

For SSL:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d admin.yourdomain.com
```

## 8. Supabase Google Auth

In Supabase:

1. Enable Google provider.
2. Add your Google OAuth client id and secret.
3. Add redirect URLs:

```text
https://yourdomain.com/auth/callback
https://admin.yourdomain.com/auth/callback
```

## 9. Stripe Webhook

In Stripe Dashboard, add endpoint:

```text
https://yourdomain.com/api/stripe/webhook
```

Events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.payment_succeeded`

Copy the webhook secret into `.env.production` as `STRIPE_WEBHOOK_SECRET`.

## 10. First Admin

After signing in once with Google, promote your user:

```bash
docker compose -f docker-compose.prod.yml exec mysql mysql -u root -p theaistack
```

```sql
update Profile set role = 'admin', isVerified = true where email = 'you@company.com';
```

Then open:

```text
https://admin.yourdomain.com
```

## 11. Update Deployment

```bash
cd /var/www/theaistack
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml exec app npx prisma db push
```

## 12. Required Production Checklist

- DNS points to VPS
- SSL installed for public and admin domains
- `.env.production` completed
- MySQL volume backed up
- Supabase Google OAuth enabled
- Stripe live keys and webhook configured
- First admin user promoted
- Nginx reverse proxy active
- Docker restart policy active
