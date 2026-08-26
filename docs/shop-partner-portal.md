# Shop partner portal

Partners manage:

- Shop **blurb** + **logo** (app profile)
- **Limited-time deals** with start/end date & time (not Bean Book membership coupons)

Membership coupon copy stays managed by Bean Book admin / SQL — not this portal.

## URL

`/partners/login`

## Temporary super-admin (all shops)

- **Email:** `adminjoja@gmail.com`
- **Password:** `123456`

## Setup

1. Run `docs/shop-partner-portal-migration.sql` in the Supabase SQL Editor  
   **or** create tables via the ensure script’s SQL (already applied if you used the setup script).

2. Generate Prisma client after schema changes:

```bash
npx prisma generate
```

3. Create / reset the backdoor partner account:

```bash
node scripts/ensure-shop-partner-admin.mjs
```

(Requires `DATABASE_URL` — use the same env as the site.)
## Later: per-shop logins

1. Insert a `ShopPartnerUser` with `role = shop_owner`
2. Add `ShopPartnerAccess` rows for their `shops.id` values
