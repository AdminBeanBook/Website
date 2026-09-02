import { normalizeContactAddress } from "@/lib/contacts/address";
import { prisma } from "@/lib/db";

export type ContactCsvImportResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["name", "full name", "contact", "contact name"],
  firstName: ["first name", "first", "firstname", "given name"],
  lastName: ["last name", "last", "lastname", "surname", "family name"],
  email: ["email", "e-mail", "email address", "e mail"],
  phone: [
    "phone",
    "phone number",
    "mobile",
    "cell",
    "telephone",
    "tel",
    "default address phone",
  ],
  notes: ["notes", "note", "comments"],
  taxExempt: ["tax exempt", "taxexempt", "exempt"],
  company: ["company", "company name", "default address company"],
  addressName: [
    "recipient",
    "recipient name",
    "shipping name",
    "address name",
    "attn",
    "attention",
  ],
  addressLine1: [
    "street",
    "address",
    "address 1",
    "address1",
    "line 1",
    "line1",
    "street address",
    "shipping address",
    "address line 1",
    "default address address1",
    "default address address 1",
  ],
  addressLine2: [
    "apt",
    "suite",
    "unit",
    "address 2",
    "address2",
    "line 2",
    "line2",
    "address line 2",
    "default address address2",
    "default address address 2",
  ],
  addressCity: ["city", "town", "default address city"],
  addressState: [
    "state",
    "province",
    "region",
    "st",
    "default address province code",
    "default address province",
    "default address state",
  ],
  addressPostal: [
    "zip",
    "zip code",
    "zipcode",
    "postal",
    "postal code",
    "postcode",
    "default address zip",
  ],
  addressCountry: [
    "country",
    "country code",
    "default address country code",
    "default address country",
  ],
};

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[_./]+/g, " ")
    .replace(/\s+/g, " ");
}

function countUnquoted(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === delimiter) count += 1;
  }
  return count;
}

function firstLine(text: string): string {
  const end = text.search(/\r|\n/);
  return end === -1 ? text : text.slice(0, end);
}

export function detectCsvDelimiter(content: string): "," | ";" | "\t" {
  const header = firstLine(content.replace(/^\uFEFF/, ""));
  const comma = countUnquoted(header, ",");
  const semi = countUnquoted(header, ";");
  const tab = countUnquoted(header, "\t");
  if (tab > comma && tab > semi) return "\t";
  if (semi > comma) return ";";
  return ",";
}

function splitDelimitedLine(line: string, delimiter: string): string[] {
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
    if (ch === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}

export function parseContactCsv(content: string): Record<string, string>[] {
  const text = content.replace(/^\uFEFF/, "");
  if (text.startsWith("PK")) {
    throw new Error(
      "That looks like an Excel workbook (.xlsx). In Excel, use File → Save As → CSV UTF-8 (Comma delimited).",
    );
  }

  const delimiter = detectCsvDelimiter(text);
  const rows: Record<string, string>[] = [];
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
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
      if (current.trim().length > 0) lines.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim().length > 0) lines.push(current);

  if (lines.length < 2) return rows;

  const headers = splitDelimitedLine(lines[0], delimiter).map((h) =>
    h.trim(),
  );
  for (let i = 1; i < lines.length; i++) {
    const cells = splitDelimitedLine(lines[i], delimiter);
    if (cells.every((c) => !c.trim())) continue;
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      row[header] = (cells[idx] ?? "").trim().replace(/^'+/, "").trim();
    });
    rows.push(row);
  }
  return rows;
}

function cell(
  row: Record<string, string>,
  field: keyof typeof HEADER_ALIASES,
): string {
  const aliases = HEADER_ALIASES[field];
  for (const alias of aliases) {
    for (const [header, value] of Object.entries(row)) {
      if (normalizeHeader(header) === alias && value.trim()) {
        return value.trim();
      }
    }
  }
  return "";
}

function isTruthy(value: string): boolean {
  return ["1", "true", "yes", "y", "exempt"].includes(value.trim().toLowerCase());
}

export function mapContactCsvRow(row: Record<string, string>) {
  const firstName = cell(row, "firstName");
  const lastName = cell(row, "lastName");
  const joined = [firstName, lastName].filter(Boolean).join(" ");
  const emailRaw = cell(row, "email").toLowerCase();
  const email = emailRaw.includes("@") ? emailRaw : "";
  const company = cell(row, "company");
  const name = cell(row, "name") || joined || (email ? email.split("@")[0] : "");

  if (!name) return null;

  return {
    name,
    email: email || null,
    phone: cell(row, "phone") || null,
    notes: cell(row, "notes") || null,
    taxExempt: isTruthy(cell(row, "taxExempt")),
    addressName: cell(row, "addressName") || company || name,
    addressLine1: cell(row, "addressLine1") || null,
    addressLine2: cell(row, "addressLine2") || null,
    addressCity: cell(row, "addressCity") || null,
    addressState: cell(row, "addressState") || null,
    addressPostal: cell(row, "addressPostal") || null,
    addressCountry: cell(row, "addressCountry") || "US",
  };
}

export async function importContactsFromCsv(
  content: string,
  defaultTagId?: string,
): Promise<ContactCsvImportResult> {
  const rows = parseContactCsv(content);
  if (rows.length === 0) {
    throw new Error(
      "No data rows found. Use a header row plus at least one contact, saved as CSV UTF-8.",
    );
  }
  if (rows.length > 5000) {
    throw new Error("CSV is limited to 5,000 rows.");
  }

  const result: ContactCsvImportResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const tagConnect = defaultTagId
    ? { connect: { id: defaultTagId } }
    : undefined;

  for (let i = 0; i < rows.length; i++) {
    const mapped = mapContactCsvRow(rows[i]);
    if (!mapped) {
      result.skipped += 1;
      continue;
    }

    try {
      const address = normalizeContactAddress({
        addressName: mapped.addressName,
        addressLine1: mapped.addressLine1,
        addressLine2: mapped.addressLine2,
        addressCity: mapped.addressCity,
        addressState: mapped.addressState,
        addressPostal: mapped.addressPostal,
        addressCountry: mapped.addressCountry,
      });

      const existing = mapped.email
        ? await prisma.contact.findFirst({
            where: {
              email: { equals: mapped.email, mode: "insensitive" },
            },
          })
        : await prisma.contact.findFirst({
            where: {
              name: { equals: mapped.name, mode: "insensitive" },
              email: null,
            },
          });

      if (existing) {
        await prisma.contact.update({
          where: { id: existing.id },
          data: {
            active: true,
            name: mapped.name || existing.name,
            email: mapped.email || existing.email,
            phone: mapped.phone || existing.phone,
            notes: mapped.notes || existing.notes,
            ...(mapped.taxExempt ? { taxExempt: true } : {}),
            ...(address ?? {}),
            ...(tagConnect ? { tags: tagConnect } : {}),
          },
        });
        result.updated += 1;
        continue;
      }

      await prisma.contact.create({
        data: {
          name: mapped.name,
          email: mapped.email,
          phone: mapped.phone,
          notes: mapped.notes,
          taxExempt: mapped.taxExempt,
          active: true,
          ...(address ?? {}),
          ...(tagConnect ? { tags: tagConnect } : {}),
        },
      });
      result.created += 1;
    } catch (err) {
      result.skipped += 1;
      result.errors.push(
        `Row ${i + 2}: ${err instanceof Error ? err.message : "Could not import"}`,
      );
    }
  }

  return result;
}
