import type { Order } from "@prisma/client";
import {
  getLabelFileType,
  getShipFromAddress,
  isShippoConfigured,
  type ShipFromAddress,
} from "@/lib/shipping/config";
import type { ParcelSpec } from "@/lib/shipping/packages";

const SHIPPO_API = "https://api.goshippo.com";

type ShippoAddress = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
};

type ShippoRate = {
  object_id: string;
  amount: string;
  currency: string;
  provider: string;
  servicelevel?: { name?: string; token?: string };
  estimated_days?: number;
  duration_terms?: string;
};

type ShippoShipment = {
  object_id: string;
  status: string;
  rates: ShippoRate[];
  messages?: { text?: string }[];
};

type ShippoTransaction = {
  object_id: string;
  status: string;
  tracking_number?: string;
  tracking_url_provider?: string;
  label_url?: string;
  rate?: { amount?: string; currency?: string; provider?: string };
  messages?: { text?: string }[];
};

export type ShippingRateOption = {
  objectId: string;
  amount: string;
  currency: string;
  provider: string;
  service: string;
  estimatedDays: number | null;
  durationTerms: string | null;
};

function getApiToken(): string {
  const token = process.env.SHIPPO_API_TOKEN?.trim();
  if (!token) {
    throw new Error("SHIPPO_API_TOKEN is not configured");
  }
  return token;
}

async function shippoFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${SHIPPO_API}${path}`, {
    ...init,
    headers: {
      Authorization: `ShippoToken ${getApiToken()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const data = (await response.json()) as T & {
    detail?: string;
    message?: string;
  };

  if (!response.ok) {
    const msg =
      (data as { detail?: string }).detail ??
      (data as { message?: string }).message ??
      `Shippo API error (${response.status})`;
    throw new Error(msg);
  }

  return data;
}

function toShippoAddress(addr: ShipFromAddress): ShippoAddress {
  return {
    name: addr.name,
    street1: addr.street1,
    street2: addr.street2,
    city: addr.city,
    state: addr.state,
    zip: addr.zip,
    country: addr.country,
    phone: addr.phone,
    email: addr.email,
  };
}

function orderToAddress(order: Order): ShippoAddress {
  if (!order.shippingLine1 || !order.shippingCity || !order.shippingState || !order.shippingPostal) {
    throw new Error("Order is missing a complete shipping address");
  }

  return {
    name: order.shippingName ?? order.customerName ?? "Customer",
    street1: order.shippingLine1,
    street2: order.shippingLine2 ?? undefined,
    city: order.shippingCity,
    state: order.shippingState,
    zip: order.shippingPostal,
    country: order.shippingCountry ?? "US",
    phone: order.customerPhone ?? undefined,
    email: order.customerEmail,
  };
}

function buildShippoParcel(parcel: ParcelSpec) {
  return {
    length: String(parcel.lengthIn),
    width: String(parcel.widthIn),
    height: String(parcel.heightIn),
    distance_unit: "in",
    weight: String(parcel.weightOz),
    mass_unit: "oz",
  };
}

function mapRates(rates: ShippoRate[]): ShippingRateOption[] {
  return rates
    .map((rate) => ({
      objectId: rate.object_id,
      amount: rate.amount,
      currency: rate.currency,
      provider: rate.provider,
      service: rate.servicelevel?.name ?? "Standard",
      estimatedDays: rate.estimated_days ?? null,
      durationTerms: rate.duration_terms ?? null,
    }))
    .sort((a, b) => Number(a.amount) - Number(b.amount));
}

export function assertShippoReady() {
  if (!isShippoConfigured()) {
    throw new Error(
      "Shippo is not configured. Add SHIPPO_API_TOKEN and SHIP_FROM_* variables (including PHONE and EMAIL for USPS) to .env.local",
    );
  }

  const from = getShipFromAddress();
  if (!from.phone || !from.email) {
    throw new Error(
      "Seller phone and email are required for USPS. Set SHIP_FROM_PHONE and SHIP_FROM_EMAIL in .env.local (your business info, not the customer on the order).",
    );
  }
}

export async function createShipmentForOrder(
  order: Order,
  parcel: ParcelSpec,
) {
  assertShippoReady();

  const shipment = await shippoFetch<ShippoShipment>("/shipments/", {
    method: "POST",
    body: JSON.stringify({
      address_from: toShippoAddress(getShipFromAddress()),
      address_to: orderToAddress(order),
      parcels: [buildShippoParcel(parcel)],
      async: false,
      metadata: `Bean Book order ${order.id} · ${parcel.name}`,
    }),
  });

  if (shipment.status === "ERROR") {
    const detail =
      shipment.messages?.map((m) => m.text).filter(Boolean).join("; ") ||
      "Could not get shipping rates";
    throw new Error(detail);
  }

  return {
    shipmentId: shipment.object_id,
    rates: mapRates(shipment.rates ?? []),
  };
}

export async function purchaseLabel(rateObjectId: string, orderId: string) {
  assertShippoReady();

  const labelFileType = getLabelFileType();

  const transaction = await shippoFetch<ShippoTransaction>("/transactions/", {
    method: "POST",
    body: JSON.stringify({
      rate: rateObjectId,
      label_file_type: labelFileType,
      async: false,
      metadata: `Bean Book order ${orderId}`,
    }),
  });

  if (transaction.status !== "SUCCESS") {
    const detail =
      transaction.messages?.map((m) => m.text).filter(Boolean).join("; ") ||
      "Label purchase failed";
    throw new Error(detail);
  }

  const amount = transaction.rate?.amount;
  const labelCostCents = amount
    ? Math.round(Number(amount) * 100)
    : null;

  return {
    transactionId: transaction.object_id,
    trackingNumber: transaction.tracking_number ?? null,
    trackingUrl: transaction.tracking_url_provider ?? null,
    labelUrl: transaction.label_url ?? null,
    carrier: transaction.rate?.provider ?? null,
    labelCostCents,
  };
}

export function getShippoDashboardUrl(): string {
  return "https://apps.goshippo.com/";
}
