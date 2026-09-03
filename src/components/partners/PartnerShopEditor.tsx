"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type DealRow = {
  id: string;
  shopId: string;
  title: string;
  body: string;
  startsAt: string | null;
  expiresAt: string;
};

type Props = {
  brandKey: string;
  displayName: string;
  shopIds: string[];
  locationCount: number;
  initialDescription: string;
  initialLogoUrl: string | null;
};

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatDealWindow(startsAt: string | null, expiresAt: string) {
  const start = startsAt ? new Date(startsAt) : null;
  const end = new Date(expiresAt);
  const fmt = (d: Date) =>
    d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  if (!start) return `Until ${fmt(end)}`;
  return `${fmt(start)} → ${fmt(end)}`;
}

function dealStatus(startsAt: string | null, expiresAt: string) {
  const now = Date.now();
  const start = startsAt ? new Date(startsAt).getTime() : 0;
  const end = new Date(expiresAt).getTime();
  if (now < start) return "Scheduled";
  if (now > end) return "Ended";
  return "Live";
}

export function PartnerShopEditor({
  brandKey,
  displayName,
  shopIds,
  locationCount,
  initialDescription,
  initialLogoUrl,
}: Props) {
  const router = useRouter();
  const [description, setDescription] = useState(initialDescription);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [deals, setDeals] = useState<DealRow[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [dealTitle, setDealTitle] = useState("");
  const [dealBody, setDealBody] = useState("");
  const [dealStartsAt, setDealStartsAt] = useState(() => toLocalInputValue(new Date()));
  const [dealExpiresAt, setDealExpiresAt] = useState(() => {
    const end = new Date();
    end.setHours(end.getHours() + 24);
    return toLocalInputValue(end);
  });
  const [savingDeal, setSavingDeal] = useState(false);
  const [dealMessage, setDealMessage] = useState<string | null>(null);
  const [dealError, setDealError] = useState<string | null>(null);

  const shopIdsKey = useMemo(() => shopIds.join(","), [shopIds]);

  const loadDeals = useCallback(async () => {
    setDealsLoading(true);
    try {
      const res = await fetch(`/api/partners/deals?shopIds=${encodeURIComponent(shopIdsKey)}`);
      const data = (await res.json()) as { deals?: DealRow[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not load deals");
      setDeals(data.deals ?? []);
    } catch (err) {
      setDealError(err instanceof Error ? err.message : "Could not load deals");
    } finally {
      setDealsLoading(false);
    }
  }, [shopIdsKey]);

  useEffect(() => {
    void loadDeals();
  }, [loadDeals]);

  function onPickLogo(file: File | null) {
    setPendingFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (savingProfile) return;
    setSavingProfile(true);
    setProfileError(null);
    setProfileMessage(null);

    try {
      let nextLogo = logoUrl;
      if (pendingFile) {
        const form = new FormData();
        form.append("file", pendingFile);
        const uploadRes = await fetch("/api/partners/media", {
          method: "POST",
          body: form,
        });
        const uploadText = await uploadRes.text();
        let uploadData: { url?: string; error?: string } = {};
        try {
          uploadData = uploadText
            ? (JSON.parse(uploadText) as { url?: string; error?: string })
            : {};
        } catch {
          throw new Error(
            `Logo upload failed (${uploadRes.status}). Try a JPEG or PNG under 3 MB.`,
          );
        }
        if (!uploadRes.ok || !uploadData.url) {
          throw new Error(uploadData.error ?? "Logo upload failed");
        }
        nextLogo = uploadData.url;
        setLogoUrl(nextLogo);
        setPendingFile(null);
      }

      const res = await fetch("/api/partners/shops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopIds,
          description,
          logoUrl: nextLogo,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      setProfileMessage("Profile saved for the Bean Book app.");
      router.refresh();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleCreateDeal(e: React.FormEvent) {
    e.preventDefault();
    if (savingDeal) return;
    setSavingDeal(true);
    setDealError(null);
    setDealMessage(null);

    try {
      const res = await fetch("/api/partners/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopIds,
          title: dealTitle,
          body: dealBody,
          startsAt: new Date(dealStartsAt).toISOString(),
          expiresAt: new Date(dealExpiresAt).toISOString(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not create deal");

      setDealTitle("");
      setDealBody("");
      setDealMessage("Limited-time deal published.");
      await loadDeals();
    } catch (err) {
      setDealError(err instanceof Error ? err.message : "Could not create deal");
    } finally {
      setSavingDeal(false);
    }
  }

  async function handleDeleteDeal(deal: DealRow) {
    if (!confirm("Delete this deal?")) return;
    setDealError(null);
    try {
      const res = await fetch(`/api/partners/deals`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopIds,
          title: deal.title,
          body: deal.body,
          startsAt: deal.startsAt,
          expiresAt: deal.expiresAt,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not delete deal");
      await loadDeals();
    } catch (err) {
      setDealError(err instanceof Error ? err.message : "Could not delete deal");
    }
  }

  const shownLogo = previewUrl || logoUrl;

  // Dedupe deals that were created for every location with the same title/window
  const uniqueDeals = useMemo(() => {
    const seen = new Set<string>();
    const rows: DealRow[] = [];
    for (const deal of deals) {
      const key = `${deal.title}|${deal.body}|${deal.startsAt}|${deal.expiresAt}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(deal);
    }
    return rows;
  }, [deals]);

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/partners"
          className="text-sm font-medium text-[#6B3F1F] hover:underline"
        >
          ← All shops
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">{displayName}</h1>
        <p className="mt-1 text-sm text-[#6B3F1F]/80">
          {locationCount} location{locationCount === 1 ? "" : "s"} · profile
          edits apply to all ({brandKey})
        </p>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        <h2 className="text-lg font-semibold">Shop profile</h2>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Logo</label>
          <label className="flex h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#2C1A0E]/25 bg-white">
            {shownLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shownLogo}
                alt=""
                className="max-h-36 max-w-[80%] object-contain"
              />
            ) : (
              <span className="text-sm text-[#6B3F1F]/70">Tap to choose logo</span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickLogo(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold" htmlFor="blurb">
            Blurb
          </label>
          <textarea
            id="blurb"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-[#2C1A0E]/15 bg-white px-3 py-2 text-sm"
            placeholder="Short description members see on Redeem / Map"
          />
        </div>

        {profileError && <p className="text-sm text-red-700">{profileError}</p>}
        {profileMessage && (
          <p className="text-sm text-green-800">{profileMessage}</p>
        )}

        <button
          type="submit"
          disabled={savingProfile}
          className="rounded-xl bg-[#2C1A0E] px-4 py-3 text-sm font-semibold text-[#F5EFE0] disabled:opacity-50"
        >
          {savingProfile ? "Saving…" : "Save profile"}
        </button>
      </form>

      <section className="space-y-6 border-t border-[#2C1A0E]/10 pt-8">
        <div>
          <h2 className="text-lg font-semibold">Limited-time deals</h2>
          <p className="mt-1 text-sm text-[#6B3F1F]/80">
            One-off promos for Bean Book members (not your membership coupons) —
            e.g. “10% off a pastry, today only.”
          </p>
        </div>

        <form onSubmit={handleCreateDeal} className="space-y-4 rounded-xl border border-[#2C1A0E]/10 bg-white p-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="deal-title">
              Deal title
            </label>
            <input
              id="deal-title"
              value={dealTitle}
              onChange={(e) => setDealTitle(e.target.value)}
              required
              className="w-full rounded-xl border border-[#2C1A0E]/15 px-3 py-2 text-sm"
              placeholder="10% off any pastry"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold" htmlFor="deal-body">
              Details
            </label>
            <textarea
              id="deal-body"
              value={dealBody}
              onChange={(e) => setDealBody(e.target.value)}
              required
              rows={3}
              className="w-full rounded-xl border border-[#2C1A0E]/15 px-3 py-2 text-sm"
              placeholder="Today only. Show this screen at the register."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="deal-start">
                Starts
              </label>
              <input
                id="deal-start"
                type="datetime-local"
                value={dealStartsAt}
                onChange={(e) => setDealStartsAt(e.target.value)}
                required
                className="w-full rounded-xl border border-[#2C1A0E]/15 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="deal-end">
                Ends
              </label>
              <input
                id="deal-end"
                type="datetime-local"
                value={dealExpiresAt}
                onChange={(e) => setDealExpiresAt(e.target.value)}
                required
                className="w-full rounded-xl border border-[#2C1A0E]/15 px-3 py-2 text-sm"
              />
            </div>
          </div>
          {dealError && <p className="text-sm text-red-700">{dealError}</p>}
          {dealMessage && <p className="text-sm text-green-800">{dealMessage}</p>}
          <button
            type="submit"
            disabled={savingDeal}
            className="rounded-xl bg-[#D4A847] px-4 py-3 text-sm font-semibold text-[#2C1A0E] disabled:opacity-50"
          >
            {savingDeal ? "Publishing…" : "Publish deal"}
          </button>
        </form>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#6B3F1F]/70">
            Your deals
          </h3>
          {dealsLoading ? (
            <p className="text-sm text-[#6B3F1F]/70">Loading…</p>
          ) : uniqueDeals.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#2C1A0E]/15 bg-white px-4 py-6 text-sm text-[#6B3F1F]/70">
              No limited-time deals yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {uniqueDeals.map((deal) => {
                const status = dealStatus(deal.startsAt, deal.expiresAt);
                return (
                  <li
                    key={deal.id}
                    className="flex flex-col gap-3 rounded-xl border border-[#2C1A0E]/10 bg-white p-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{deal.title}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            status === "Live"
                              ? "bg-green-100 text-green-800"
                              : status === "Scheduled"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                      <p className="text-sm text-[#2C1A0E]/80">{deal.body}</p>
                      <p className="text-xs text-[#6B3F1F]/70">
                        {formatDealWindow(deal.startsAt, deal.expiresAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeleteDeal(deal)}
                      className="shrink-0 text-sm text-red-700 hover:underline"
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
