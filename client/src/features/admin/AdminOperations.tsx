"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button, Card, Textarea } from "@/components/ui";
import { StatusPill } from "@/components/StatusPill";

export function AdminManageBookings() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const res = await apiFetch<{ items: any[] }>("/api/bookings/admin");
    setItems(res.items);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(id: string, action: "approve" | "reject") {
    await apiFetch(`/api/bookings/admin/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ action, adminNote: note[id] || "" })
    });
    await load();
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Bookings</h2>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

      <div className="mt-4 grid gap-4">
        {items.map((b) => (
          <div key={b._id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold">{b.vehicleId?.brand} {b.vehicleId?.model}</div>
                <div className="mt-1 text-sm text-slate-600">Buyer: {b.buyerId?.name} • {b.buyerId?.phone}</div>
                <div className="mt-1 text-sm text-slate-600">Lister: {b.listerId?.name} • {b.listerId?.phone}</div>
                <div className="mt-1 text-sm text-slate-600">{new Date(b.pickupDate).toLocaleDateString()} → {new Date(b.returnDate).toLocaleDateString()}</div>
              </div>
              <StatusPill value={b.status} />
            </div>

            <div className="mt-3">
              <div className="mb-1 text-xs font-semibold text-slate-600">Admin note</div>
              <Textarea rows={2} value={note[b._id] || ""} onChange={(e) => setNote((s) => ({ ...s, [b._id]: e.target.value }))} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => void decide(b._id, "approve")}>Approve</Button>
              <Button variant="secondary" onClick={() => void decide(b._id, "reject")}>
                Reject
              </Button>
            </div>
          </div>
        ))}

        {!loading && items.length === 0 ? <div className="text-sm text-slate-600">No bookings.</div> : null}
      </div>
    </Card>
  );
}

export function AdminManageLoans() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const res = await apiFetch<{ items: any[] }>("/api/loan-requests/admin");
    setItems(res.items);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function decide(id: string, action: "approve" | "reject") {
    await apiFetch(`/api/loan-requests/admin/${id}/decision`, {
      method: "POST",
      body: JSON.stringify({ action, internalNotes: note[id] || "" })
    });
    await load();
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Loan Requests</h2>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

      <div className="mt-4 grid gap-4">
        {items.map((r) => (
          <div key={r._id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold">Requested ₹{r.requestedAmount}</div>
                <div className="mt-1 text-sm text-slate-600">Buyer: {r.buyerId?.name} • {r.buyerId?.phone}</div>
                <div className="mt-1 text-sm text-slate-600">Lender: {r.lenderId?.name} • {r.lenderId?.phone}</div>
                <div className="mt-1 text-sm text-slate-600">Income: ₹{r.monthlyIncome}/month • {r.employmentStatus}</div>
                <div className="mt-1 text-sm text-slate-600">Collateral: {r.collateralType} — {r.collateralDescription}</div>
                {Array.isArray(r.documents) && r.documents.length ? (
                  <div className="mt-1 text-sm text-slate-600">Documents uploaded: {r.documents.length}</div>
                ) : null}
              </div>
              <StatusPill value={r.status} />
            </div>

            <div className="mt-3">
              <div className="mb-1 text-xs font-semibold text-slate-600">Internal notes</div>
              <Textarea rows={2} value={note[r._id] || ""} onChange={(e) => setNote((s) => ({ ...s, [r._id]: e.target.value }))} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => void decide(r._id, "approve")}>Approve loan</Button>
              <Button variant="secondary" onClick={() => void decide(r._id, "reject")}>
                Reject loan
              </Button>
            </div>
          </div>
        ))}

        {!loading && items.length === 0 ? <div className="text-sm text-slate-600">No loan requests.</div> : null}
      </div>
    </Card>
  );
}
