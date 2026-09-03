-- Email drafts for admin compose. Safe to run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS "EmailDraft" (
  "id" TEXT NOT NULL,
  "subject" TEXT NOT NULL DEFAULT '',
  "htmlBody" TEXT NOT NULL DEFAULT '',
  "senderKey" TEXT NOT NULL DEFAULT 'customers',
  "audience" TEXT,
  "customEmails" TEXT NOT NULL DEFAULT '',
  "tagIdsJson" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailDraft_pkey" PRIMARY KEY ("id")
);
