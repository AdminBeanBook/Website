import { upsertContactFromCustomer } from "@/lib/contacts/from-customer";
import { prisma } from "@/lib/db";
import { BEAN_BOOK_2026 } from "@/lib/products";

export type ImportOrderRow = {
  externalId: string;
  stripeSessionId: string;
  customerEmail: string;
  customerName: string | null;
  customerPhone: string | null;
  amountCents: number;
  discountCode: string | null;
  discountCents: number;
  status: string;
  productId: string | null;
  shippingName: string | null;
  shippingLine1: string | null;
  shippingLine2: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingPostal: string | null;
  shippingCountry: string | null;
  trackingNumber: string | null;
  notes: string | null;
  createdAt: Date | null;
  shippedAt: Date | null;
};

export type ImportOrdersResult = {
  created: number;
  skipped: number;
  errors: string[];
};

function parseMoneyToCents(value: string | undefined): number {
  if (!value?.trim()) return 0;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return 0;
  return Math.round(num * 100);
}

function parseShopifyDate(value: string | undefined): Date | null {
  if (!value?.trim()) return null;
  const d = new Date(value.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizePostal(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/^['']+/, "");
  return trimmed || null;
}

function mapShopifyFinancialStatus(
  financial: string,
  fulfillment: string,
  refundedAmountCents: number,
  totalCents: number,
): string {
  const fin = financial.trim().toLowerCase();
  const ful = fulfillment.trim().toLowerCase();

  if (fin === "refunded" || fin === "voided") {
    return "refunded";
  }
  if (fin === "partially_refunded") {
    return refundedAmountCents >= totalCents && totalCents > 0
      ? "refunded"
      : "paid";
  }
  if (refundedAmountCents > 0 && refundedAmountCents >= totalCents) {
    return "refunded";
  }
  if (fin === "pending" || fin === "authorized") {
    return "unpaid";
  }
  if (ful === "fulfilled") {
    return "archived";
  }
  return "paid";
}

function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const val = row[key]?.trim();
    if (val) return val;
  }
  return "";
}

function parseCsv(content: string): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i++;
      if (current.length > 0) lines.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.length > 0) lines.push(current);

  if (lines.length === 0) return rows;

  const headers = splitCsvLine(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    if (cells.every((c) => !c.trim())) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = cells[idx]?.trim() ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}

export function parseShopifyOrdersCsv(content: string): ImportOrderRow[] {
  const rows = parseCsv(content);
  if (rows.length === 0) return [];

  const grouped = new Map<string, Record<string, string>[]>();
  for (const row of rows) {
    const key =
      pick(row, "Id", "id") ||
      pick(row, "Name", "name") ||
      `row_${grouped.size}`;
    const list = grouped.get(key) ?? [];
    list.push(row);
    grouped.set(key, list);
  }

  const orders: ImportOrderRow[] = [];

  for (const [externalId, lineRows] of grouped) {
    const first = lineRows[0];
    const email = pick(first, "Email", "email").toLowerCase();
    if (!email || !email.includes("@")) continue;

    const financial = pick(first, "Financial Status", "financial_status");
    const fulfillment = pick(
      first,
      "Fulfillment Status",
      "fulfillment_status",
    );
    const totalCents = parseMoneyToCents(pick(first, "Total", "total"));
    const refundedCents = parseMoneyToCents(
      pick(first, "Refunded Amount", "refunded_amount"),
    );
    const status = mapShopifyFinancialStatus(
      financial,
      fulfillment,
      refundedCents,
      totalCents,
    );

    const paymentRef = pick(
      first,
      "Payment Reference",
      "payment_reference",
      "Payment ID",
    );
    const stripeSessionId = paymentRef.startsWith("cs_")
      ? paymentRef
      : `legacy_shopify_${externalId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

    const discountCents = parseMoneyToCents(
      pick(first, "Discount Amount", "discount_amount"),
    );
    const createdAt = parseShopifyDate(
      pick(first, "Created at", "created_at", "Paid at", "paid_at"),
    );
    const fulfilledAt = parseShopifyDate(
      pick(first, "Fulfilled at", "fulfilled_at"),
    );

    const lineSummary = lineRows
      .map((r) => pick(r, "Lineitem name", "lineitem_name"))
      .filter(Boolean)
      .join(", ");

    const notesParts = [
      pick(first, "Notes", "notes"),
      lineSummary ? `Items: ${lineSummary}` : "",
      `Imported from Shopify order ${pick(first, "Name", "name") || externalId}`,
    ].filter(Boolean);

    orders.push({
      externalId,
      stripeSessionId,
      customerEmail: email,
      customerName: pick(first, "Shipping Name", "shipping_name", "Billing Name") || null,
      customerPhone:
        pick(
          first,
          "Shipping Phone",
          "shipping_phone",
          "Billing Phone",
          "billing_phone",
          "Phone",
          "phone",
        ) || null,
      amountCents: totalCents > 0 ? totalCents : BEAN_BOOK_2026.priceCents,
      discountCode: pick(first, "Discount Code", "discount_code") || null,
      discountCents,
      status,
      productId: BEAN_BOOK_2026.id,
      shippingName: pick(first, "Shipping Name", "shipping_name") || null,
      shippingLine1:
        pick(
          first,
          "Shipping Street",
          "shipping_street",
          "Shipping Address1",
          "shipping_address1",
        ) || null,
      shippingLine2:
        pick(first, "Shipping Address2", "shipping_address2") || null,
      shippingCity: pick(first, "Shipping City", "shipping_city") || null,
      shippingState:
        pick(
          first,
          "Shipping Province",
          "shipping_province",
          "Shipping State",
        ) || null,
      shippingPostal: normalizePostal(
        pick(first, "Shipping Zip", "shipping_zip", "Shipping Postal") || null,
      ),
      shippingCountry:
        pick(first, "Shipping Country", "shipping_country") || "US",
      trackingNumber:
        pick(first, "Tracking Number", "tracking_number") || null,
      notes: notesParts.join("\n"),
      createdAt,
      shippedAt: status === "archived" ? fulfilledAt : null,
    });
  }

  return orders;
}

export type ImportCsvFormat =
  | "shopify_orders"
  | "shopify_transactions"
  | "unknown";

export function detectImportCsvFormat(content: string): ImportCsvFormat {
  const header = content.split(/\r?\n/)[0]?.toLowerCase() ?? "";
  if (
    header.includes("financial status") ||
    header.includes("fulfillment status")
  ) {
    return "shopify_orders";
  }
  if (header.includes("kind") && header.includes("gateway")) {
    return "shopify_transactions";
  }
  return "unknown";
}

/** Shopify Admin → Orders → Export → Transactions (CSV). No customer emails. */
export function parseShopifyTransactionsCsv(content: string): ImportOrderRow[] {
  const rows = parseCsv(content);
  if (rows.length === 0) return [];

  const grouped = new Map<string, Record<string, string>[]>();
  for (const row of rows) {
    const key = pick(row, "Order", "order");
    if (!key) continue;
    const list = grouped.get(key) ?? [];
    list.push(row);
    grouped.set(key, list);
  }

  const orders: ImportOrderRow[] = [];

  for (const [orderId, txns] of grouped) {
    const orderName = pick(txns[0], "Name", "name") || `#${orderId}`;
    const payments = txns
      .filter((t) => {
        const kind = pick(t, "Kind", "kind").toLowerCase();
        const status = pick(t, "Status", "status").toLowerCase();
        return (
          (kind === "sale" || kind === "capture") && status === "success"
        );
      })
      .sort(
        (a, b) =>
          (parseShopifyDate(pick(a, "Created At", "created_at"))?.getTime() ??
            0) -
          (parseShopifyDate(pick(b, "Created At", "created_at"))?.getTime() ??
            0),
      );

    const refunds = txns.filter((t) => {
      const kind = pick(t, "Kind", "kind").toLowerCase();
      const status = pick(t, "Status", "status").toLowerCase();
      return kind === "refund" && status === "success";
    });

    const pendingOnly = txns.filter(
      (t) => pick(t, "Status", "status").toLowerCase() === "pending",
    );

    if (payments.length === 0) {
      if (pendingOnly.length === 0) continue;
      const pending = pendingOnly[0];
      const amountCents = parseMoneyToCents(pick(pending, "Amount", "amount"));
      orders.push({
        externalId: orderId,
        stripeSessionId: `legacy_shopify_${orderId}`,
        customerEmail: `order-${orderId}@legacy.import`,
        customerName: orderName,
        customerPhone: null,
        amountCents: amountCents > 0 ? amountCents : BEAN_BOOK_2026.priceCents,
        discountCode: null,
        discountCents: 0,
        status: "unpaid",
        productId: BEAN_BOOK_2026.id,
        shippingName: null,
        shippingLine1: null,
        shippingLine2: null,
        shippingCity: null,
        shippingState: null,
        shippingPostal: null,
        shippingCountry: null,
        trackingNumber: null,
        notes: buildTransactionNotes(orderName, orderId, txns, {
          note: "Imported from Shopify transactions export (pending payment).",
        }),
        createdAt: parseShopifyDate(
          pick(pending, "Created At", "created_at"),
        ),
        shippedAt: null,
      });
      continue;
    }

    const paymentTotal = payments.reduce(
      (sum, t) => sum + parseMoneyToCents(pick(t, "Amount", "amount")),
      0,
    );
    const refundTotal = refunds.reduce(
      (sum, t) => sum + parseMoneyToCents(pick(t, "Amount", "amount")),
      0,
    );
    const netCents = Math.max(0, paymentTotal - refundTotal);
    const primary = payments[0];
    const status =
      refundTotal >= paymentTotal && paymentTotal > 0
        ? "refunded"
        : "archived";

    orders.push({
      externalId: orderId,
      stripeSessionId: `legacy_shopify_${orderId}`,
      customerEmail: `order-${orderId}@legacy.import`,
      customerName: orderName,
      customerPhone: null,
      amountCents: netCents > 0 ? netCents : paymentTotal,
      discountCode: null,
      discountCents: 0,
      status,
      productId: BEAN_BOOK_2026.id,
      shippingName: null,
      shippingLine1: null,
      shippingLine2: null,
      shippingCity: null,
      shippingState: null,
      shippingPostal: null,
      shippingCountry: null,
      trackingNumber: null,
      notes: buildTransactionNotes(orderName, orderId, txns, {
        refundCents: refundTotal,
      }),
      createdAt: parseShopifyDate(
        pick(primary, "Created At", "created_at"),
      ),
      shippedAt:
        status === "archived"
          ? parseShopifyDate(pick(primary, "Created At", "created_at"))
          : null,
    });
  }

  return orders;
}

function buildTransactionNotes(
  orderName: string,
  orderId: string,
  txns: Record<string, string>[],
  extra: { note?: string; refundCents?: number },
): string {
  const lines = [
    `Imported from Shopify transactions export.`,
    `Shopify order ${orderName} (ID ${orderId}).`,
    extra.note,
    extra.refundCents
      ? `Refunds on file: $${(extra.refundCents / 100).toFixed(2)}`
      : null,
    "Customer email/address not in this export — add a Shopify Orders CSV to enrich.",
    ...txns.map((t) => {
      const kind = pick(t, "Kind", "kind");
      const status = pick(t, "Status", "status");
      const amount = pick(t, "Amount", "amount");
      const gateway = pick(t, "Gateway", "gateway");
      const at = pick(t, "Created At", "created_at");
      return `· ${kind} ${status} $${amount} via ${gateway} (${at})`;
    }),
  ].filter(Boolean);
  return lines.join("\n");
}

export function parseImportCsv(content: string): {
  format: ImportCsvFormat;
  rows: ImportOrderRow[];
} {
  const format = detectImportCsvFormat(content);
  if (format === "shopify_transactions") {
    return { format, rows: parseShopifyTransactionsCsv(content) };
  }
  if (format === "shopify_orders") {
    return { format, rows: parseShopifyOrdersCsv(content) };
  }
  return { format, rows: [] };
}

export async function importOrders(
  rows: ImportOrderRow[],
  options?: { dryRun?: boolean },
): Promise<ImportOrdersResult> {
  const dryRun = options?.dryRun ?? false;
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const existing = await prisma.order.findUnique({
        where: { stripeSessionId: row.stripeSessionId },
      });
      if (existing) {
        skipped += 1;
        continue;
      }

      if (dryRun) {
        created += 1;
        continue;
      }

      const customer = await prisma.customer.upsert({
        where: { email: row.customerEmail },
        create: {
          email: row.customerEmail,
          name: row.customerName,
          phone: row.customerPhone,
        },
        update: {
          name: row.customerName ?? undefined,
          phone: row.customerPhone ?? undefined,
        },
      });

      await upsertContactFromCustomer({
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
      });

      await prisma.order.create({
        data: {
          stripeSessionId: row.stripeSessionId,
          status: row.status,
          amountCents: row.amountCents,
          discountCents: row.discountCents,
          discountCode: row.discountCode,
          productId: row.productId,
          customerId: customer.id,
          customerEmail: row.customerEmail,
          customerName: row.customerName,
          customerPhone: row.customerPhone,
          shippingName: row.shippingName,
          shippingLine1: row.shippingLine1,
          shippingLine2: row.shippingLine2,
          shippingCity: row.shippingCity,
          shippingState: row.shippingState,
          shippingPostal: row.shippingPostal,
          shippingCountry: row.shippingCountry,
          trackingNumber: row.trackingNumber,
          labelUrl: row.trackingNumber ? "imported" : null,
          notes: row.notes,
          shippedAt: row.shippedAt,
          createdAt: row.createdAt ?? undefined,
        },
      });
      created += 1;
    } catch (err) {
      errors.push(
        `${row.externalId}: ${err instanceof Error ? err.message : "Import failed"}`,
      );
    }
  }

  return { created, skipped, errors };
}
