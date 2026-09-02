export type ContactAddress = {
  addressName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostal: string | null;
  addressCountry: string | null;
};

export type ShippingLike = {
  shippingName?: string | null;
  shippingLine1?: string | null;
  shippingLine2?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
  shippingPostal?: string | null;
  shippingCountry?: string | null;
};

function blankToNull(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function normalizeContactAddress(
  input: Partial<ContactAddress> | null | undefined,
): ContactAddress | null {
  if (!input) return null;
  const addressLine1 = blankToNull(input.addressLine1);
  if (!addressLine1) return null;
  return {
    addressName: blankToNull(input.addressName),
    addressLine1,
    addressLine2: blankToNull(input.addressLine2),
    addressCity: blankToNull(input.addressCity),
    addressState: blankToNull(input.addressState),
    addressPostal: blankToNull(input.addressPostal),
    addressCountry: blankToNull(input.addressCountry) ?? "US",
  };
}

export function addressFromShipping(
  shipping: ShippingLike | null | undefined,
): ContactAddress | null {
  if (!shipping) return null;
  return normalizeContactAddress({
    addressName: shipping.shippingName,
    addressLine1: shipping.shippingLine1,
    addressLine2: shipping.shippingLine2,
    addressCity: shipping.shippingCity,
    addressState: shipping.shippingState,
    addressPostal: shipping.shippingPostal,
    addressCountry: shipping.shippingCountry,
  });
}

export function formatContactAddress(
  contact: Partial<ContactAddress>,
): string {
  const street = [contact.addressLine1, contact.addressLine2]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
  const cityLine = [
    contact.addressCity?.trim(),
    [contact.addressState, contact.addressPostal]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" "),
  ]
    .filter(Boolean)
    .join(", ");
  return [contact.addressName?.trim(), street, cityLine]
    .filter(Boolean)
    .join(" · ");
}
