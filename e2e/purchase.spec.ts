import { expect, test } from "@playwright/test";
import {
  completeStripeHostedCheckout,
  hasStripeTestKey,
} from "./helpers/stripe-checkout";

test.describe("Full purchase flow", () => {
  test.beforeEach(() => {
    test.skip(
      !hasStripeTestKey(),
      "Set STRIPE_SECRET_KEY=sk_test_... in .env.local for full purchase E2E"
    );
  });

  test("guest can buy the Bean Book and land on success page", async ({
    page,
  }) => {
    const buyerEmail = `e2e-${Date.now()}@thebeanbook.test`;

    await page.goto("/products/bean-book-2026-edition");
    await page.getByRole("button", { name: "Buy Now — $25" }).click();

    await completeStripeHostedCheckout(page, { email: buyerEmail });

    await expect(page).toHaveURL(/\/checkout\/success\?session_id=cs_/);
    await expect(page.getByRole("heading", { name: "Thank you!" })).toBeVisible();
    await expect(page.getByText(/Order reference: cs_/)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "View coffee shops" })
    ).toHaveAttribute("href", "/map");
  });

  test("cancelled checkout can be retried from cancel page", async ({
    page,
  }) => {
    await page.goto("/checkout/cancel");

    await expect(
      page.getByRole("heading", { name: "Checkout cancelled" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Try again" }).click();
    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30_000 });
  });
});
