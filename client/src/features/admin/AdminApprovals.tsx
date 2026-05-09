"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button, Card, Textarea } from "@/components/ui";
import { StatusPill } from "@/components/StatusPill";

export function AdminApproveVehicles() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const res = await apiFetch<{ items: any[] }>("/api/vehicles/admin/pending");
    setItems(res.items);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(id: string, action: "approve" | "reject") {
    await apiFetch(`/api/vehicles/admin/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ action, adminNote: note[id] || "" })
    });
    await load();
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Pending Vehicle Listings</h2>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

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
              <div className="mb-1 text-xs font-semibold text-slate-600">Admin note</div>
              <Textarea rows={2} value={note[v._id] || ""} onChange={(e) => setNote((s) => ({ ...s, [v._id]: e.target.value }))} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => void decide(v._id, "approve")}>Approve</Button>
              <Button variant="secondary" onClick={() => void decide(v._id, "reject")}>
                Reject
              </Button>
            </div>
          </div>
        ))}

        {!loading && items.length === 0 ? <div className="text-sm text-slate-600">No pending listings.</div> : null}
      </div>
    </Card>
  );
}

export function AdminApproveOffers() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const res = await apiFetch<{ items: any[] }>("/api/finance-offers/admin/pending");
    setItems(res.items);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(id: string, action: "approve" | "reject") {
    await apiFetch(`/api/finance-offers/admin/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ action, adminNote: note[id] || "" })
    });
    await load();
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Pending Finance Offers</h2>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

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
              <div className="mb-1 text-xs font-semibold text-slate-600">Admin note</div>
              <Textarea rows={2} value={note[o._id] || ""} onChange={(e) => setNote((s) => ({ ...s, [o._id]: e.target.value }))} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => void decide(o._id, "approve")}>Approve</Button>
              <Button variant="secondary" onClick={() => void decide(o._id, "reject")}>
                Reject
              </Button>
            </div>
          </div>
        ))}

        {!loading && items.length === 0 ? <div className="text-sm text-slate-600">No pending offers.</div> : null}
      </div>
    </Card>
  );
}
