# Supabase Auth And Storage

TheAiStack now uses MySQL as the primary application database. Supabase is optional and limited to authentication and object storage if you want managed OAuth/session handling and media buckets.

## Auth Provider

Roles live in the MySQL `Profile.role` column:

- `user`
- `creator`
- `founder`
- `moderator`
- `admin`

Supported Auth providers:

- Email/password
- Google
- GitHub
- Twitter/X

The MySQL `Profile.externalAuthId` field stores the Supabase Auth user id.

## Storage

Optional buckets:

- `tool-media`: screenshots, launch images, product video files.
- `site-assets`: logo, favicon, homepage banners, SEO images.
- `review-media`: user review images and videos.

Public reads are allowed for these buckets. Authenticated users can upload review and tool media. Admins can upload site assets.

## Database Boundary

Do not create Supabase Postgres tables for application data.

These belong in MySQL through Prisma:

- tools and categories
- reviews, discussions, and comments
- premium plans, subscriptions, and payments
- website settings and homepage sections
- media metadata
- creator and founder profiles
- analytics, rankings, bookmarks, AI stacks
- social accounts, affiliate links, creator earnings
- newsletters, ads, and launch campaigns
