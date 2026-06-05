export type ContactTagRow = {
  id: string;
  name: string;
  slug: string;
  color: string;
  contactCount?: number;
};

export type ContactRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  active: boolean;
  tags: ContactTagRow[];
  createdAt: string;
  updatedAt: string;
};
