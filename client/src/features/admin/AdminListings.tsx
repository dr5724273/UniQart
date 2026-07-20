"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button, Card } from "@/components/ui";
import { StatusPill } from "@/components/StatusPill";

export function AdminVehicleListings() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ items: any[] }>("/api/vehicles/admin/all");
      setItems(res.items);
    } catch (err: any) {
      setError(err?.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggleOffline(id: string, current: boolean) {
    setProcessing(s => ({ ...s, [id]: true }));
    try {
      await apiFetch(`/api/vehicles/admin/${id}/offline`, {
        method: "PATCH",
        body: JSON.stringify({ isOffline: !current })
      });
      await load();
    } catch (err: any) {
      alert(err?.message || "Failed to toggle status");
    } finally {
      setProcessing(s => ({ ...s, [id]: false }));
    }
  }

  async function deleteVehicle(id: string) {
    if (!window.confirm("Delete this vehicle? This action cannot be undone.")) return;
    setProcessing(s => ({ ...s, [id]: true }));
    try {
      await apiFetch(`/api/vehicles/admin/${id}`, { method: "DELETE" });
      await load();
    } catch (err: any) {
      alert(err?.message || "Failed to delete");
    } finally {
      setProcessing(s => ({ ...s, [id]: false }));
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Vehicle Listings</h2>
        <Button variant="secondary" onClick={() => void load()}>Refresh</Button>
      </div>
      {error ? <div className="mt-3 text-sm text-red-600 font-semibold">{error}</div> : null}
      {loading ? <div className="mt-3 text-sm text-slate-500">Loading...</div> : null}
      
      <div className="mt-4 grid gap-3">
        {items.map(v => (
          <div key={v._id} className="border border-slate-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold">{v.brand} {v.model} ({v.year})</div>
                <div className="text-xs text-slate-600 mt-1">Owner: {v.ownerId?.name}</div>
                <div className="text-xs font-semibold text-slate-800 mt-1">
                  Status: {v.isOffline ? <span className="text-red-600">OFFLINE</span> : <span className="text-green-600">ONLINE</span>}
                </div>
              </div>
              <StatusPill value={v.status} />
            </div>
            <div className="mt-3 flex gap-2">
              <Button 
                variant="secondary" 
                disabled={processing[v._id]} 
                onClick={() => toggleOffline(v._id, v.isOffline)}
              >
                {v.isOffline ? "Set Online" : "Set Offline"}
              </Button>
              <Button 
                variant="secondary" 
                disabled={processing[v._id]} 
                onClick={() => deleteVehicle(v._id)}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && <div className="text-sm text-slate-500">No vehicles.</div>}
      </div>
    </Card>
  );
}

export function AdminFinanceListings() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ items: any[] }>("/api/finance-offers/admin/all");
      setItems(res.items);
    } catch (err: any) {
      setError(err?.message || "Failed to load offers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function deleteOffer(id: string) {
    if (!window.confirm("Delete this finance offer?")) return;
    setProcessing(s => ({ ...s, [id]: true }));
    try {
      await apiFetch(`/api/finance-offers/admin/${id}`, { method: "DELETE" });
      await load();
    } catch (err: any) {
      alert(err?.message || "Failed to delete");
    } finally {
      setProcessing(s => ({ ...s, [id]: false }));
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold">Finance Listings</h2>
        <Button variant="secondary" onClick={() => void load()}>Refresh</Button>
      </div>
      {error ? <div className="mt-3 text-sm text-red-600 font-semibold">{error}</div> : null}
      {loading ? <div className="mt-3 text-sm text-slate-500">Loading...</div> : null}
      
      <div className="mt-4 grid gap-3">
        {items.map(f => (
          <div key={f._id} className="border border-slate-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold">₹{f.minLoan} - ₹{f.maxLoan}</div>
                <div className="text-xs text-slate-600 mt-1">Lender: {f.lenderId?.name}</div>
                <div className="text-xs font-semibold text-slate-800 mt-1">
                  Interest: {f.interestRate}% | Collateral: {f.collateralRequired}
                </div>
              </div>
              <StatusPill value={f.status} />
            </div>
            <div className="mt-3 flex gap-2">
              <Button 
                variant="secondary" 
                disabled={processing[f._id]} 
                onClick={() => deleteOffer(f._id)}
                className="text-red-600 hover:text-red-700"
              >
                Delete Offer
              </Button>
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && <div className="text-sm text-slate-500">No finance offers.</div>}
      </div>
    </Card>
  );
}
