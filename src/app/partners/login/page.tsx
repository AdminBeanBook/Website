"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PartnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/partners/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push("/partners");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#2C1A0E] px-6"
    >
      <div className="mb-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D4A847]">
          Shop partners
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#F5EFE0]">
          Bean Book portal
        </h1>
      </div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
        required
        autoComplete="username"
        className="w-full max-w-xs border border-white/30 bg-transparent px-3 py-2 text-[#F5EFE0] placeholder:text-white/50 focus:border-[#D4A847] focus:outline-none"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        required
        autoComplete="current-password"
        className="w-full max-w-xs border border-white/30 bg-transparent px-3 py-2 text-[#F5EFE0] placeholder:text-white/50 focus:border-[#D4A847] focus:outline-none"
      />
      {error && (
        <p className="w-full max-w-xs text-center text-sm text-red-300">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full max-w-xs bg-[#D4A847] px-3 py-2 text-sm font-semibold text-[#2C1A0E] hover:bg-[#e0b85a] disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
