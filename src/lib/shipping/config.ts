export type ShipFromAddress = {
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

export type ParcelDefaults = {
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  weightOz: number;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function getShipFromAddress(): ShipFromAddress {
  return {
    name: requiredEnv("SHIP_FROM_NAME"),
    street1: requiredEnv("SHIP_FROM_STREET1"),
    street2: optionalEnv("SHIP_FROM_STREET2"),
    city: requiredEnv("SHIP_FROM_CITY"),
    state: requiredEnv("SHIP_FROM_STATE"),
    zip: requiredEnv("SHIP_FROM_ZIP"),
    country: optionalEnv("SHIP_FROM_COUNTRY") ?? "US",
    phone: optionalEnv("SHIP_FROM_PHONE"),
    email: optionalEnv("SHIP_FROM_EMAIL"),
  };
}

export function getParcelDefaults(): ParcelDefaults {
  return {
    lengthIn: Number(process.env.PACKAGE_LENGTH_IN ?? "10"),
    widthIn: Number(process.env.PACKAGE_WIDTH_IN ?? "8"),
    heightIn: Number(process.env.PACKAGE_HEIGHT_IN ?? "1"),
    weightOz: Number(process.env.PACKAGE_WEIGHT_OZ ?? "13"),
  };
}

const SHIPPO_REQUIRED_ENV = [
  "SHIPPO_API_TOKEN",
  "SHIP_FROM_NAME",
  "SHIP_FROM_STREET1",
  "SHIP_FROM_CITY",
  "SHIP_FROM_STATE",
  "SHIP_FROM_ZIP",
  "SHIP_FROM_PHONE",
  "SHIP_FROM_EMAIL",
] as const;

export function getShippoConfigMissing(): string[] {
  return SHIPPO_REQUIRED_ENV.filter((key) => !process.env[key]?.trim());
}

export function isShippoConfigured(): boolean {
  return getShippoConfigMissing().length === 0;
}

/** Shippo label_file_type — https://docs.goshippo.com/docs/shipments/shippinglabelsizes/ */
export const SHIPPO_LABEL_FILE_TYPES = [
  "PDF_4x6",
  "PDF",
  "PDF_4x8",
  "PDF_2.3x7.5",
  "PDF_A4",
  "PDF_A6",
  "PNG",
  "ZPLII",
] as const;

export type ShippoLabelFileType = (typeof SHIPPO_LABEL_FILE_TYPES)[number];

/** Default 4×6 for thermal label printers (Rollo, Zebra, etc.). */
export function getLabelFileType(): ShippoLabelFileType {
  const raw = process.env.SHIPPO_LABEL_FILE_TYPE?.trim() || "PDF_4x6";
  if (
    SHIPPO_LABEL_FILE_TYPES.includes(raw as ShippoLabelFileType)
  ) {
    return raw as ShippoLabelFileType;
  }
  return "PDF_4x6";
}

export function labelFileTypeDescription(type: ShippoLabelFileType): string {
  if (type === "PDF_4x6") return "4×6 inch (thermal label printers)";
  if (type === "PDF") return "8.5×11 inch (letter)";
  if (type === "ZPLII") return "ZPL (direct thermal, no PDF)";
  return type;
}
