"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { LoanRequest } from "@/lib/types";
import { Button, Card } from "@/components/ui";
import { StatusPill } from "@/components/StatusPill";

export function BuyerMyLoans() {
  const [items, setItems] = useState<LoanRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await apiFetch<{ items: LoanRequest[] }>("/api/loan-requests/mine");
    setItems(res.items);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">My Loan Requests</h2>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

      <div className="mt-4 grid gap-3">
        {items.map((r: any) => (
          <div key={r._id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-extrabold">Requested ₹{r.requestedAmount}</div>
                {r.durationMonths ? (
                  <div className="mt-1 text-sm text-slate-600">
                    Duration: {r.durationMonths >= 12 ? `${r.durationMonths / 12} year${r.durationMonths === 12 ? "" : "s"}` : `${r.durationMonths} months`}
                  </div>
                ) : null}
                <div className="mt-1 text-sm text-slate-600">Lender: {r.financeOfferId?.lenderId?.name || "Lister"}</div>
              </div>
              <StatusPill value={r.status} />
            </div>
            {r.internalNotes ? <div className="mt-2 text-sm text-slate-600">Admin notes: {r.internalNotes}</div> : null}
          </div>
        ))}
        {!loading && items.length === 0 ? <div className="text-sm text-slate-600">No loan requests yet.</div> : null}
      </div>
    </Card>
  );
}
