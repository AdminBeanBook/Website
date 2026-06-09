import type { Page } from "@playwright/test";

const TEST_CARD = "4242424242424242";
const TEST_EXPIRY = "1234";
const TEST_CVC = "123";

export type StripeCheckoutDetails = {
  email?: string;
  name?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
};

async function fillInFrames(
  page: Page,
  selectors: string[],
  value: string,
  timeout = 20_000
): Promise<boolean> {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      if (frame.url().includes("link-login")) continue;

      for (const selector of selectors) {
        const locator = frame.locator(selector).first();
        if (await locator.isVisible({ timeout: 500 }).catch(() => false)) {
          await locator.fill(value);
          return true;
        }
      }
    }
    await page.waitForTimeout(250);
  }

  return false;
}

/**
 * Completes Stripe Hosted Checkout in test mode.
 * Matches the shipping-first layout (email → address → payment method → card).
 */
export async function completeStripeHostedCheckout(
  page: Page,
  details: StripeCheckoutDetails = {}
) {
  const {
    email = "e2e-buyer@thebeanbook.test",
    name = "E2E Test Buyer",
    addressLine1 = "123 Main St",
    city = "Denver",
    state = "Colorado",
    zip = "80202",
    phone = "3035550100",
  } = details;

  await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 });
  await page.waitForLoadState("domcontentloaded");

  const emailField = page
    .getByLabel(/^email$/i)
    .or(page.getByPlaceholder("email@example.com"))
    .or(page.locator('input[name="email"]'));
  await emailField.waitFor({ state: "visible", timeout: 30_000 });
  await emailField.fill(email);

  const nameField = page.getByLabel(/full name/i);
  if (await nameField.isVisible({ timeout: 5000 }).catch(() => false)) {
    await nameField.fill(name);
  }

  const manualAddress = page.getByRole("button", { name: /enter address manually/i });
  if (await manualAddress.isVisible({ timeout: 2000 }).catch(() => false)) {
    await manualAddress.click();
  }

  const addressField = page.getByLabel(/^address$/i).or(
    page.locator('input[name="shippingAddressLine1"]')
  );
  if (await addressField.isVisible({ timeout: 5000 }).catch(() => false)) {
    await addressField.fill(addressLine1);
  }

  const cityField = page.getByLabel(/^city$/i).or(
    page.locator('input[name="shippingAddressCity"]')
  );
  if (await cityField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await cityField.fill(city);
  }

  const stateField = page.getByLabel(/^state$/i).or(
    page.locator('select[name="shippingAddressState"]')
  );
  if (await stateField.isVisible({ timeout: 3000 }).catch(() => false)) {
    const tagName = await stateField.evaluate((el) => el.tagName.toLowerCase());
    if (tagName === "select") {
      await stateField.selectOption({ label: state });
    } else {
      await stateField.fill(state);
    }
  }

  const zipField = page.getByLabel(/zip|postal/i).or(
    page.locator('input[name="shippingAddressZip"]')
  );
  if (await zipField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await zipField.fill(zip);
  }

  const phoneField = page.locator('input[type="tel"]').first();
  await phoneField.waitFor({ state: "visible", timeout: 10_000 });
  await phoneField.fill(phone);

  const cardSelectors = [
    'input[name="cardnumber"]',
    'input[name="number"]',
    'input[placeholder*="1234" i]',
    'input[aria-label*="Card number" i]',
    'input[data-elements-stable-field-name="cardNumber"]',
  ];

  let cardFilled = await fillInFrames(page, cardSelectors, TEST_CARD, 3_000);

  if (!cardFilled) {
    await page
      .locator("#payment-method-accordion-item-title-card")
      .click({ force: true });
    cardFilled = await fillInFrames(page, cardSelectors, TEST_CARD, 30_000);
  }

  if (!cardFilled) {
    throw new Error("Could not find Stripe card number field");
  }

  await fillInFrames(
    page,
    [
      'input[name="exp-date"]',
      'input[name="expiry"]',
      'input[placeholder*="MM" i]',
      'input[aria-label*="expiration" i]',
      'input[data-elements-stable-field-name="cardExpiry"]',
    ],
    TEST_EXPIRY
  );

  await fillInFrames(
    page,
    [
      'input[name="cvc"]',
      'input[placeholder*="CVC" i]',
      'input[aria-label*="CVC" i]',
      'input[aria-label*="security code" i]',
      'input[data-elements-stable-field-name="cardCvc"]',
    ],
    TEST_CVC
  );

  const payButton = page.getByTestId("hosted-payment-submit-button");
  await payButton.scrollIntoViewIfNeeded();
  await payButton.click();

  await page.waitForURL(/\/checkout\/success/, { timeout: 90_000 });
}

export function hasStripeTestKey(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_test_");
}
