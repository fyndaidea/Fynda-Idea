"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { money } from "@/lib/store/policy";
import { ShimmerBlock } from "@/components/ui/Shimmer";

type Purchase = {
  id: string;
  title: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
};

function statusLabel(status: string) {
  if (status === "paid") return "Ready to download";
  if (status === "pending") return "Purchasing paused";
  if (status === "refunded") return "Refunded";
  if (status === "disputed") return "Under review";
  return status;
}

export function PurchasesSection() {
  const cancelled = useSearchParams().get("cancelled") === "1";
  const [orders, setOrders] = useState<Purchase[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/store/orders", { credentials: "include", signal: controller.signal, cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load purchases.");
        if (!controller.signal.aborted) setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (loadError) {
        if (!controller.signal.aborted) setError(loadError instanceof Error ? loadError.message : "Could not load purchases.");
      }
    })();
    return () => controller.abort();
  }, []);

  if (error) return <p className="text-sm text-[#bc2525]" role="alert">{error}</p>;
  if (!orders) {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading purchases">
        <ShimmerBlock className="h-24 w-full" rounded="rounded-2xl" />
        <ShimmerBlock className="h-24 w-full" rounded="rounded-2xl" />
      </div>
    );
  }

  return (
    <div>
      {cancelled ? <p className="mb-4 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] px-4 py-3 text-sm" role="status">Purchasing is currently unavailable.</p> : null}
      {orders.length ? (
        <ul className="grid gap-3">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-col gap-4 rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--muted)]">{statusLabel(order.status)}</p>
                <h2 className="mt-1 text-base font-semibold text-[color:var(--foreground)]">{order.title}</h2>
                <p className="mt-1 text-xs text-[color:var(--muted)]">{money(order.amount_cents, order.currency)} · {new Date(order.created_at).toLocaleDateString("en", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })}</p>
              </div>
              {order.status === "paid" ? <a className="inline-flex h-10 items-center justify-center rounded-full bg-[color:var(--accent)] px-4 text-sm font-semibold text-white" href={`/api/store/orders/${order.id}/download`}>Download</a> : <p className="max-w-xs text-xs leading-5 text-[color:var(--muted)]">{order.status === "pending" ? "This order is pending. New payments are not enabled." : order.status === "refunded" ? "This purchase was refunded." : order.status === "disputed" ? "Access is paused while this payment is reviewed." : "This payment did not complete."}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-[color:var(--card-border)] bg-[color:var(--card)] px-6 py-12 text-center">
          <h2 className="text-lg font-semibold">Your library starts here.</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[color:var(--muted)]">Your purchased products will appear here with private download links.</p>
          <Link className="mt-5 inline-flex h-10 items-center rounded-full bg-[color:var(--accent)] px-4 text-sm font-semibold text-white" href="/store">Explore the store</Link>
        </div>
      )}
    </div>
  );
}
