export type ContactTagRow = {
  id: string;
  name: string;
  slug: string;
  color: string;
  contactCount?: number;
};

export type ContactRow = {
  id: string;
  company: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  active: boolean;
  taxExempt: boolean;
  addressName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostal: string | null;
  addressCountry: string | null;
  tags: ContactTagRow[];
  createdAt: string;
  updatedAt: string;
};
