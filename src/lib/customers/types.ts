import type { ContactTagRow } from "@/lib/contacts/types";

export type CustomerOrderSummary = {
  id: string;
  createdAt: string;
  amountCents: number;
  status: string;
};

export type CustomerRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  notes: string | null;
  tags: ContactTagRow[];
  orderCount: number;
  orders?: CustomerOrderSummary[];
  createdAt: string;
  updatedAt: string;
};
