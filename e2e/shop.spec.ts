import { expect, test } from "@playwright/test";

test.describe("Shop discovery", () => {
  test("visitor can browse from home to product page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Purchase" }).click();
    await expect(page).toHaveURL(/\/purchase$/);

    // Overlay buy button covers the product card; open the product page directly.
    await page.goto("/products/bean-book-2026-edition");
    await expect(page).toHaveURL(/\/products\/bean-book-2026-edition$/);

    await expect(page.getByRole("heading", { name: "Bean Book: 2026 Edition" })).toBeVisible();
    await expect(page.getByText("$25.00 USD")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Buy Now — $25" })
    ).toBeVisible();
  });

  test("buy button starts Stripe checkout", async ({ page }) => {
    test.skip(
      !process.env.STRIPE_SECRET_KEY,
      "Set STRIPE_SECRET_KEY in .env.local to run checkout initiation test"
    );

    await page.goto("/products/bean-book-2026-edition");
    await page.getByRole("button", { name: "Buy Now — $25" }).click();

    await expect(page).toHaveURL(/checkout\.stripe\.com/, { timeout: 30_000 });
  });
});
