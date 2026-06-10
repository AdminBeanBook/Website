# Production launch checklist

Use this list to get checkout, **invoice payments**, and admin orders working on the live site.

## 1. Database (required on Vercel)

SQLite (`file:./dev.db`) only works on your laptop. On Vercel the filesystem is ephemeral — orders would disappear on redeploy.

1. Create a free [Neon](https://neon.tech) (or Supabase) Postgres database.
2. Copy the connection string (`postgresql://...`).
3. In `prisma/schema.prisma`, change the datasource provider to `postgresql` (if still `sqlite`).
4. Set `DATABASE_URL` in Vercel to that connection string.
5. After deploy (or locally with production URL in `.env.local`):

   ```bash
   npx dotenv -e .env.local -- prisma db push
   npx dotenv -e .env.local -- tsx prisma/seed.ts
   ```

6. Change `ADMIN_PASSWORD` in env before seeding production, or update the admin user after.

## 2. Stripe live keys

In [Stripe Dashboard](https://dashboard.stripe.com) switch to **Live** mode (toggle top right).

| Variable | Where to get it |
|----------|-----------------|
| `STRIPE_SECRET_KEY` | Developers → API keys → **Secret key** (`sk_live_...`) |
| `NEXT_PUBLIC_SITE_URL` | Your live site, e.g. `https://thebeanbook.org` (no trailing slash) |
| `GOOGLE_MAP_EMBED_URL` | Google My Maps embed iframe `src` (Map page). Copy from `.env.local`. |

Add these in **Vercel → Project → Settings → Environment Variables** for Production.

> `.env.local` is only on your laptop — it is **not** deployed. The live site needs the same values in Vercel.

## 3. Stripe webhook (auto “paid” orders)

This is what moves **Unpaid → Paid** when someone pays an invoice or completes checkout.

1. Stay in **Live** mode in Stripe.
2. Go to [Developers → Webhooks](https://dashboard.stripe.com/webhooks) → **Add endpoint**.
3. **Endpoint URL:**

   ```
   https://YOUR-DOMAIN.com/api/webhooks/stripe
   ```

   Example: `https://thebeanbook.org/api/webhooks/stripe`

4. **Select events** (at minimum):

   - `checkout.session.completed`
   - `invoice.paid`

5. Click **Add endpoint**, then open it → **Signing secret** → **Reveal** → copy `whsec_...`.

6. In Vercel, add:

   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

7. Redeploy (or restart) so the new env var loads.

8. In the webhook’s **Recent deliveries** tab, send a test event or pay a real/test-live invoice and confirm responses are **200**.

### Local testing (before go-live)

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Paste the printed `whsec_...` into `.env.local`, restart `npm run dev`, then pay a test invoice. The order should leave **Unpaid** and appear under **Unfulfilled**.

## 4. Stripe Invoicing (retail / bulk orders)

1. [Settings → Billing → Invoices](https://dashboard.stripe.com/settings/billing/invoice) (live mode).
2. Confirm invoicing is enabled for your account.
3. In admin: **Create order** → **Send Stripe invoice** → customer gets email in **live** mode.

## 5. Other production env vars

| Variable | Notes |
|----------|--------|
| `AUTH_SECRET` | Long random string (32+ chars); never use the example value |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used on first `db:seed` only |
| `SHIPPO_API_TOKEN` | **Live** token from Shippo (`shippo_live_...`) |
| `SHIP_FROM_*` | Real fulfillment address; `SHIP_FROM_PHONE` and `SHIP_FROM_EMAIL` required for USPS |

## 6. Deploy to Vercel

1. Push the repo to GitHub and import in Vercel.
2. Set all env vars above for **Production**.
3. Build command (default is fine): `prisma generate && next build`
4. Optionally add a one-time deploy step or run locally after first deploy:

   ```bash
   DATABASE_URL="your-neon-url" npx prisma db push
   DATABASE_URL="your-neon-url" npx tsx prisma/seed.ts
   ```

5. Point DNS for `thebeanbook.org` to Vercel.

## 7. Smoke test after launch

- [ ] **Buy Now** on the site → payment → order appears in admin (webhook).
- [ ] **Create order** + **Send invoice** → customer receives email (live).
- [ ] Pay invoice → order leaves **Unpaid** (webhook `invoice.paid`).
- [ ] **Get shipping rates** → **Buy label** (Shippo live token).
- [ ] Admin login works; change password from default if you seeded with a temp password.

## Fallback if webhook fails

On **Unpaid** orders you can still use **Mark as paid** manually. Fix webhook delivery in Stripe Dashboard → Webhooks → failed events → logs.
