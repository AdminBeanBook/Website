# The Bean Book Website

A rebuild of [thebeanbook.org](https://thebeanbook.org) with **Stripe Checkout** for orders (no Shopify).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/purchase` | Shop |
| `/products/bean-book-2026-edition` | Product detail |
| `/map` | Coffee shop directory (searchable) |
| `/learn-more` | Team |
| `/contact` | Contact form |
| `/so-what-is-it` | About the passbook |
| `/checkout/success` | Post-payment confirmation |
| `/checkout/cancel` | Abandoned checkout |

## Stripe setup

1. Create a [Stripe account](https://dashboard.stripe.com/register) and get your **test** API keys.
2. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. Run the site and click **Buy Now** — you’ll be redirected to Stripe Checkout.

### Webhooks (recommended for production)

Webhooks notify your app when payment succeeds (for fulfillment emails, inventory, etc.).

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Forward events locally:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. Copy the webhook signing secret into `.env.local`:

   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

4. In production, add an endpoint in the Stripe Dashboard:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `invoice.paid`

   Full go-live steps (database, live keys, Vercel): **[PRODUCTION.md](./PRODUCTION.md)**.

Enable **Invoicing** in the [Stripe Dashboard](https://dashboard.stripe.com/settings/billing/invoice) for retail/bulk **Send invoice** on unpaid orders.

Without `STRIPE_WEBHOOK_SECRET`, invoice and checkout payments succeed in Stripe but orders stay **Unpaid** until you click **Mark as paid**.

### Optional env vars

| Variable | Purpose |
|----------|---------|
| `STRIPE_PRICE_ID` | Use a fixed Price from Stripe Dashboard instead of dynamic $25 |
| `SHIPPING_AMOUNT_CENTS` | Add flat US shipping (e.g. `500` for $5) |

## Shippo (admin shipping labels)

Fulfillment runs from **Admin → Orders**. You can buy labels in the app or fall back to the [Shippo dashboard](https://apps.goshippo.com/) anytime.

1. Create a [Shippo](https://goshippo.com/) account and copy your **Test** API token.
2. Add to `.env.local` (see `.env.example`):
   - `SHIPPO_API_TOKEN`
   - `SHIP_FROM_*` (your Denver fulfillment address)
   - `PACKAGE_*` (defaults: ~13 oz bubble mailer)
3. On an order with a shipping address: **Get shipping rates** → **Buy label** → open the **4×6** PDF (default for thermal label printers).
4. If the API fails, use the same customer address in the Shippo dashboard (orders include a Shippo shipment id when rates were fetched).

Use a **live** Shippo token only in production.

### Shipping packages (admin)

**Admin → Packages** lets you create mailer/box presets (dimensions in inches, weight in oz). On **Orders**, pick a package before **Get shipping rates** → **Buy label**. The first seed run creates a default “Bean Book bubble mailer” preset.

## End-to-end tests (Playwright)

Playwright automates the real buyer journey: browse the shop → **Buy Now** → pay on Stripe (test card) → **Thank you!** success page.

**Prerequisites** (in `.env.local`):

- `STRIPE_SECRET_KEY=sk_test_...`
- `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- `DATABASE_URL` (orders are saved on the success page even without webhooks)

For admin order verification via webhook, also run in a second terminal:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET` and restart the dev server.

**Run tests:**

```bash
npm run test:e2e          # all E2E tests
npm run test:e2e:purchase # full buy flow only
npm run test:e2e:ui       # interactive debugger
```

Browse-only tests run without Stripe. Full purchase tests are skipped unless `STRIPE_SECRET_KEY` is a test key (`sk_test_...`).

### GitHub Actions (CI)

E2E tests run automatically on pushes and pull requests to `main` via [`.github/workflows/e2e.yml`](./.github/workflows/e2e.yml).

Add these **repository secrets** in GitHub → Settings → Secrets and variables → Actions:

| Secret | Purpose |
|--------|---------|
| `STRIPE_SECRET_KEY` | Stripe **test** secret key (`sk_test_...`) for checkout E2E |
| `RESEND_API_KEY` | Resend API key for failure alert emails |
| `CI_NOTIFY_EMAIL` | Your email address (where CI failure alerts go) |
| `CI_NOTIFY_FROM` | Verified Resend sender, e.g. `Bean Book CI <admin@thebeanbook.org>` |

When E2E tests fail, GitHub uploads a Playwright report artifact and sends you an email with a link to the failed run.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

See **[PRODUCTION.md](./PRODUCTION.md)** for the full checklist (Postgres, live Stripe webhook, Shippo live token, smoke tests).

Deploy to Vercel (or similar), set env vars for **Production**, and point `thebeanbook.org` DNS to your host.

Use **live** Stripe keys (`sk_live_...`) and a **live** webhook signing secret (`whsec_...` from the live endpoint) only in production.
