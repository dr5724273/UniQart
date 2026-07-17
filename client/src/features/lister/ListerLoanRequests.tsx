"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { LoanRequest } from "@/lib/types";
import { Button, Card } from "@/components/ui";
import { StatusPill } from "@/components/StatusPill";

export function ListerLoanRequests() {
  const [items, setItems] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ items: LoanRequest[] }>("/api/loan-requests/lender");
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
        <h2 className="text-lg font-extrabold">Loan Requests (to you)</h2>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? <div className="mt-3 text-sm font-semibold text-red-600" role="alert">{error}</div> : null}
      {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

      <div className="mt-4 grid gap-3">
        {items.map((r: any) => (
          <div key={r._id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold">Requested ₹{r.requestedAmount}</div>
                <div className="mt-1 text-sm text-slate-600">Buyer: {r.buyerId?.name} • Phone: {r.buyerId?.phone}</div>
                <div className="mt-1 text-sm text-slate-600">Income: ₹{r.monthlyIncome}/month • {r.employmentStatus}</div>
                <div className="mt-1 text-sm text-slate-600">Collateral: {r.collateralType} — {r.collateralDescription}</div>
              </div>
              <StatusPill value={r.status} />
            </div>
            {Array.isArray(r.documents) && r.documents.length ? (
              <div className="mt-2 text-sm text-slate-600">Documents: {r.documents.length} uploaded</div>
            ) : null}
            {r.internalNotes ? <div className="mt-2 text-sm text-slate-600">Admin notes: {r.internalNotes}</div> : null}
          </div>
        ))}
        {!loading && !error && items.length === 0 ? <div className="text-sm text-slate-600">No loan requests</div> : null}
      </div>
    </Card>
  );
}
