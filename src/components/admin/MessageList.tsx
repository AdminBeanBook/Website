"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  read: boolean;
  createdAt: string;
};

export function MessageList({
  initialMessages,
}: {
  initialMessages: Message[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);

  async function markRead(id: string) {
    await fetch("/api/admin/contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, read: true }),
    });
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, read: true } : m)),
    );
    router.refresh();
  }

  if (messages.length === 0) {
    return <p className="text-gray-500">No messages yet.</p>;
  }

  return (
    <div className="space-y-4">
      {messages.map((m) => (
        <article
          key={m.id}
          className={`rounded-lg border p-5 ${
            m.read ? "border-gray-200 bg-white" : "border-brand-green/30 bg-brand-cream/30"
          }`}
        >
          <div className="flex flex-wrap justify-between gap-2">
            <div>
              <Link
                href={`/admin/messages/${m.id}`}
                className="font-medium text-brand-text hover:text-brand-green hover:underline"
              >
                {m.name}
              </Link>
              <p className="text-sm text-gray-600">
                {m.email}
                {m.phone ? ` · ${m.phone}` : ""}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(m.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/admin/messages/${m.id}`}
                className="text-sm font-medium text-brand-green hover:underline"
              >
                View & reply
              </Link>
              {!m.read && (
                <button
                  type="button"
                  onClick={() => markRead(m.id)}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
          <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-gray-700">
            {m.message}
          </p>
        </article>
      ))}
    </div>
  );
}
