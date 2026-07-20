"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button, Card } from "@/components/ui";
import { StatusPill } from "@/components/StatusPill";

export function AdminLiveOperations() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [resB, resL] = await Promise.all([
        apiFetch<{ items: any[] }>("/api/bookings/admin/live"),
        apiFetch<{ items: any[] }>("/api/loan-requests/admin/live")
      ]);
      setBookings(resB.items);
      setLoans(resL.items);
    } catch (err: any) {
      setError(err?.message || "Failed to load live operations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-blue-600">Live Bookings</h2>
          <Button variant="secondary" onClick={() => void load()}>Refresh</Button>
        </div>
        {error ? <div className="mt-3 text-sm text-red-600 font-semibold">{error}</div> : null}
        {loading && bookings.length === 0 ? <div className="mt-3 text-sm text-slate-500">Loading...</div> : null}
        
        <div className="mt-4 grid gap-3">
          {bookings.map(b => (
            <div key={b._id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="font-bold">{b.vehicleId?.brand} {b.vehicleId?.model}</div>
                <StatusPill value={b.status} />
              </div>
              <div className="text-xs text-slate-600 mt-1">Buyer: {b.buyerId?.name} | Lister: {b.listerId?.name}</div>
              <div className="text-xs font-semibold text-slate-800 mt-1">
                {new Date(b.pickupDate).toLocaleString()} → {new Date(b.returnDate).toLocaleString()}
              </div>
            </div>
          ))}
          {!loading && bookings.length === 0 && <div className="text-sm text-slate-500">No active bookings.</div>}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-green-600">Live Loans</h2>
          <Button variant="secondary" onClick={() => void load()}>Refresh</Button>
        </div>
        
        <div className="mt-4 grid gap-3">
          {loans.map(l => (
            <div key={l._id} className="border border-slate-200 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="font-bold">₹{l.requestedAmount} Loan</div>
                <StatusPill value={l.status} />
              </div>
              <div className="text-xs text-slate-600 mt-1">Borrower: {l.buyerId?.name} | Lender: {l.financeOfferId?.lenderId?.name}</div>
              <div className="text-xs font-semibold text-slate-800 mt-1">
                Duration: {l.durationMonths} Months
              </div>
            </div>
          ))}
          {!loading && loans.length === 0 && <div className="text-sm text-slate-500">No active loans.</div>}
        </div>
      </Card>
    </div>
  );
}
