export type SentEmailRecipientRow = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  error: string | null;
};

export type SentEmailBatchRow = {
  id: string;
  subject: string;
  senderKey: string;
  fromEmail: string;
  fromName: string;
  audience: string;
  htmlBody: string;
  recipientCount: number;
  successCount: number;
  failureCount: number;
  sentByEmail: string;
  dryRun: boolean;
  createdAt: string;
  recipients: SentEmailRecipientRow[];
};

export function audienceLabel(audience: string): string {
  switch (audience) {
    case "customers":
      return "All customers";
    case "contacts":
      return "Tagged contacts";
    case "custom":
      return "Custom list";
    default:
      return audience;
  }
}
