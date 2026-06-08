"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push("/admin");
      router.refresh();
    } catch {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-6"
    >
      <input
        type="text"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="username"
        required
        autoComplete="username"
        className="w-full max-w-xs border border-white/30 bg-black px-3 py-2 text-white placeholder:text-white/50 focus:border-white focus:outline-none"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        required
        autoComplete="current-password"
        className="w-full max-w-xs border border-white/30 bg-black px-3 py-2 text-white placeholder:text-white/50 focus:border-white focus:outline-none"
      />
      <button type="submit" className="sr-only">
        Sign in
      </button>
    </form>
  );
}
