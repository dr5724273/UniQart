"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button, Card, Textarea } from "@/components/ui";
import { StatusPill } from "@/components/StatusPill";

export function AdminApproveVehicles() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [deciding, setDeciding] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ items: any[] }>("/api/vehicles/admin/pending");
      setItems(res.items);
    } catch (err: any) {
      setError(err?.message || "Failed to load pending vehicles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(id: string, action: "approve" | "reject") {
    if (action === "reject" && !window.confirm("Are you sure you want to reject this vehicle listing?")) return;
    if (deciding[id]) return;
    setDeciding((s) => ({ ...s, [id]: true }));
    setError(null);
    try {
      await apiFetch(`/api/vehicles/admin/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({ action, adminNote: note[id] || "" })
      });
      await load();
    } catch (err: any) {
      setError(err?.message || "Decision failed");
    } finally {
      setDeciding((s) => ({ ...s, [id]: false }));
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Pending Vehicle Listings</h2>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? <div className="mt-3 text-sm font-semibold text-red-600" role="alert">{error}</div> : null}
      {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

      <div className="mt-4 grid gap-4">
        {items.map((v) => (
          <div key={v._id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-600">Lister</div>
                <div className="text-sm font-extrabold">{v.ownerId?.name}</div>
                <div className="text-sm text-slate-600">{v.ownerId?.email} • {v.ownerId?.phone}</div>

                <div className="mt-3 text-sm font-extrabold">{v.brand} {v.model} ({v.year})</div>
                <div className="mt-1 text-sm text-slate-600">{v.city} • ₹{v.pricePerDay}/day • Deposit ₹{v.securityDeposit}</div>
              </div>
              <StatusPill value={v.status} />
            </div>

            <div className="mt-3">
              <label htmlFor={`note-veh-${v._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Admin note</label>
              <Textarea id={`note-veh-${v._id}`} rows={2} value={note[v._id] || ""} onChange={(e) => setNote((s) => ({ ...s, [v._id]: e.target.value }))} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => void decide(v._id, "approve")} disabled={deciding[v._id]} aria-disabled={deciding[v._id]}>
                {deciding[v._id] ? "Processing…" : "Approve"}
              </Button>
              <Button variant="secondary" onClick={() => void decide(v._id, "reject")} disabled={deciding[v._id]} aria-disabled={deciding[v._id]}>
                {deciding[v._id] ? "Processing…" : "Reject"}
              </Button>
            </div>
          </div>
        ))}

        {!loading && !error && items.length === 0 ? <div className="text-sm text-slate-600">No vehicles found.</div> : null}
      </div>
    </Card>
  );
}

export function AdminApproveOffers() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [deciding, setDeciding] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ items: any[] }>("/api/finance-offers/admin/pending");
      setItems(res.items);
    } catch (err: any) {
      setError(err?.message || "Failed to load pending finance offers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(id: string, action: "approve" | "reject") {
    if (action === "reject" && !window.confirm("Are you sure you want to reject this finance offer?")) return;
    if (deciding[id]) return;
    setDeciding((s) => ({ ...s, [id]: true }));
    setError(null);
    try {
      await apiFetch(`/api/finance-offers/admin/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({ action, adminNote: note[id] || "" })
      });
      await load();
    } catch (err: any) {
      setError(err?.message || "Decision failed");
    } finally {
      setDeciding((s) => ({ ...s, [id]: false }));
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Pending Finance Offers</h2>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? <div className="mt-3 text-sm font-semibold text-red-600" role="alert">{error}</div> : null}
      {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

      <div className="mt-4 grid gap-4">
        {items.map((o) => (
          <div key={o._id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-600">Lender</div>
                <div className="text-sm font-extrabold">{o.lenderId?.name}</div>
                <div className="text-sm text-slate-600">{o.lenderId?.email} • {o.lenderId?.phone}</div>

                <div className="mt-3 text-sm font-extrabold">₹{o.minLoan} – ₹{o.maxLoan}</div>
                <div className="mt-1 text-sm text-slate-600">Interest {o.interestRate}% • Duration {o.durationMonths?.join(", ")}</div>
                <div className="mt-1 text-sm text-slate-600">Collateral: {o.collateralRequired}</div>
              </div>
              <StatusPill value={o.status} />
            </div>

            <div className="mt-3">
              <label htmlFor={`note-off-${o._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Admin note</label>
              <Textarea id={`note-off-${o._id}`} rows={2} value={note[o._id] || ""} onChange={(e) => setNote((s) => ({ ...s, [o._id]: e.target.value }))} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => void decide(o._id, "approve")} disabled={deciding[o._id]} aria-disabled={deciding[o._id]}>
                {deciding[o._id] ? "Processing…" : "Approve"}
              </Button>
              <Button variant="secondary" onClick={() => void decide(o._id, "reject")} disabled={deciding[o._id]} aria-disabled={deciding[o._id]}>
                {deciding[o._id] ? "Processing…" : "Reject"}
              </Button>
            </div>
          </div>
        ))}

        {!loading && !error && items.length === 0 ? <div className="text-sm text-slate-600">No finance offers</div> : null}
      </div>
    </Card>
  );
}
