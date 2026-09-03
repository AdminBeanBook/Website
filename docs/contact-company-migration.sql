-- Optional company name on contacts (used mainly for coffee shops).

ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "company" TEXT;
