"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button, Card } from "@/components/ui";
import { StatusPill } from "@/components/StatusPill";

type HistoryTab = "vehicles" | "offers" | "bookings" | "loans";

export function AdminHistory() {
  const [tab, setTab] = useState<HistoryTab>("vehicles");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      let endpoint = "";
      switch (tab) {
        case "vehicles": endpoint = "/api/vehicles/admin/history"; break;
        case "offers": endpoint = "/api/finance-offers/admin/history"; break;
        case "bookings": endpoint = "/api/bookings/admin/history"; break;
        case "loans": endpoint = "/api/loan-requests/admin/history"; break;
      }
      const res = await apiFetch<{ items: any[] }>(endpoint);
      setItems(res.items);
    } catch (err: any) {
      setError(err?.message || `Failed to load ${tab} history`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [tab]);

  function renderItemDetails(item: any) {
    if (tab === "vehicles") {
      return (
        <div>
          <div className="text-sm font-semibold">{item.brand} {item.model} ({item.year})</div>
          <div className="text-xs text-slate-600">Lister: {item.ownerId?.name || "Unknown"}</div>
        </div>
      );
    }
    if (tab === "offers") {
      return (
        <div>
          <div className="text-sm font-semibold">₹{item.minLoan} – ₹{item.maxLoan} at {item.interestRate}%</div>
          <div className="text-xs text-slate-600">Lender: {item.lenderId?.name || "Unknown"}</div>
        </div>
      );
    }
    if (tab === "bookings") {
      return (
        <div>
          <div className="text-sm font-semibold">{item.vehicleId?.brand} {item.vehicleId?.model}</div>
          <div className="text-xs text-slate-600">
            {new Date(item.pickupDate).toLocaleDateString()} → {new Date(item.returnDate).toLocaleDateString()}
          </div>
          <div className="text-xs text-slate-600">Buyer: {item.buyerId?.name || "Unknown"}</div>
        </div>
      );
    }
    if (tab === "loans") {
      return (
        <div>
          <div className="text-sm font-semibold">Requested: ₹{item.requestedAmount}</div>
          <div className="text-xs text-slate-600">Buyer: {item.buyerId?.name || "Unknown"}</div>
          <div className="text-xs text-slate-600">Lender: {item.lenderId?.name || "Unknown"}</div>
        </div>
      );
    }
    return null;
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Decision History</h2>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {(
          [
            ["vehicles", "Vehicles"],
            ["offers", "Finance Offers"],
            ["bookings", "Bookings"],
            ["loans", "Loans"]
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <div className="mt-4 text-sm font-semibold text-red-600" role="alert">{error}</div> : null}
      {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

      <div className="mt-4 grid gap-3">
        {!loading && !error && items.length === 0 ? (
          <div className="text-sm text-slate-600">No {tab} history found.</div>
        ) : null}

        {items.map((item) => (
          <div key={item._id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              {renderItemDetails(item)}
              <StatusPill value={item.status} />
            </div>
            
            {(item.adminNote || item.publicNote) && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                {item.adminNote && (
                  <div className="mb-1">
                    <span className="font-semibold text-slate-700">🔒 Admin Note:</span>{" "}
                    <span className="text-slate-600">{item.adminNote}</span>
                  </div>
                )}
                {item.publicNote && (
                  <div>
                    <span className="font-semibold text-slate-700">📢 Public Note:</span>{" "}
                    <span className="text-slate-600">{item.publicNote}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-2 text-xs text-slate-400">
              Updated: {new Date(item.updatedAt || item.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
