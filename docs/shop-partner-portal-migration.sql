-- Shop partner portal tables (website). Safe to run in Supabase SQL Editor.
-- Does not alter existing `shops` / `profiles` tables.

CREATE TABLE IF NOT EXISTS "ShopPartnerUser" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'shop_owner',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ShopPartnerAccess" (
  "partnerId" TEXT NOT NULL REFERENCES "ShopPartnerUser"(id) ON DELETE CASCADE,
  "shopId" UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  PRIMARY KEY ("partnerId", "shopId")
);

CREATE INDEX IF NOT EXISTS "ShopPartnerAccess_shopId_idx" ON "ShopPartnerAccess" ("shopId");
