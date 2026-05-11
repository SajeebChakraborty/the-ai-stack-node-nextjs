# MySQL Database

TheAiStack now uses MySQL as the primary application database through Prisma.

## Local Database

Create a MySQL 8 database:

```sql
create database theaistack character set utf8mb4 collate utf8mb4_unicode_ci;
create user 'theaistack'@'%' identified by 'password';
grant all privileges on theaistack.* to 'theaistack'@'%';
flush privileges;
```

Set:

```bash
DATABASE_URL="mysql://theaistack:password@localhost:3306/theaistack"
```

## Commands

```bash
npm run db:generate
npm run db:push
npm run db:studio
```

For production:

```bash
npm run db:migrate
```

## Model Coverage

The Prisma schema covers:

- users and role profiles
- tools and categories
- reviews, votes, discussions, nested comments
- premium plans, subscriptions, payments
- website settings and homepage sections
- media assets
- creator and founder profiles
- notifications, analytics, rankings, bookmarks, AI stacks
- social accounts, affiliate links, creator earnings
- newsletters, ads, launch campaigns

## Admin Subdomain

Set:

```bash
ADMIN_SUBDOMAIN_HOST=admin.yourdomain.com
NEXT_PUBLIC_ADMIN_URL=https://admin.yourdomain.com
```

Point `admin.yourdomain.com` at the same Vercel project. Middleware rewrites admin-host traffic to `/admin`, while the admin route uses its own shell without the public header/footer.
