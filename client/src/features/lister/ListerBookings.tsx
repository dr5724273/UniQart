"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Booking } from "@/lib/types";
import { Button, Card } from "@/components/ui";
import { StatusPill } from "@/components/StatusPill";

export function ListerBookings() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ items: Booking[] }>("/api/bookings/lister");
      setItems(res.items);
    } catch (err: any) {
      setError(err?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Booking Requests</h2>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? <div className="mt-3 text-sm font-semibold text-red-600" role="alert">{error}</div> : null}
      {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

      <div className="mt-4 grid gap-3">
        {items.map((b: any) => (
          <div key={b._id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold">{b.vehicleId?.brand} {b.vehicleId?.model}</div>
                <div className="mt-1 text-sm text-slate-600">Buyer: {b.buyerId?.name} • Phone: {b.buyerId?.phone}</div>
                <div className="mt-1 text-sm text-slate-600">{new Date(b.pickupDate).toLocaleDateString()} → {new Date(b.returnDate).toLocaleDateString()}</div>
              </div>
              <StatusPill value={b.status} />
            </div>
            {b.adminNote ? <div className="mt-2 text-sm text-slate-600">Admin note: {b.adminNote}</div> : null}
          </div>
        ))}
        {!loading && !error && items.length === 0 ? <div className="text-sm text-slate-600">No bookings yet</div> : null}
      </div>
    </Card>
  );
}
