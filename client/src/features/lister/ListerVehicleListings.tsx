"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { VehicleListing } from "@/lib/types";
import { Button, Card, Input, Select } from "@/components/ui";
import { StatusPill } from "@/components/StatusPill";

export function ListerVehicleListings() {
  const [items, setItems] = useState<VehicleListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vehicleType, setVehicleType] = useState<"car" | "bike">("car");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("2022");
  const [city, setCity] = useState("");
  const [pricePerDay, setPricePerDay] = useState("1500");
  const [securityDeposit, setSecurityDeposit] = useState("5000");
  const [images, setImages] = useState<FileList | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ items: VehicleListing[] }>("/api/vehicles/mine");
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

  async function createListing(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const form = new FormData();
    form.append("vehicleType", vehicleType);
    form.append("brand", brand);
    form.append("model", model);
    form.append("year", year);
    form.append("city", city);
    form.append("pricePerDay", pricePerDay);
    form.append("securityDeposit", securityDeposit);
    if (images) Array.from(images).forEach((f) => form.append("images", f));

    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const res = await fetch(`${base}/api/vehicles`, { method: "POST", body: form, credentials: "include" });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || "Create failed");

    setBrand("");
    setModel("");
    setCity("");
    setImages(null);

    await load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="text-lg font-extrabold">Create Vehicle Listing</h2>
        <p className="mt-1 text-sm text-slate-600">Starts as pending until admin approves.</p>

        <form className="mt-4 grid gap-3" onSubmit={(e) => void createListing(e)}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Vehicle Type</div>
              <Select value={vehicleType} onChange={(e) => setVehicleType(e.target.value as any)}>
                <option value="car">Car</option>
                <option value="bike">Bike</option>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Year</div>
              <Input value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Brand</div>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} required />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Model</div>
              <Input value={model} onChange={(e) => setModel(e.target.value)} required />
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">City / Location</div>
            <Input value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Rental Price / Day</div>
              <Input value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} required />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Security Deposit</div>
              <Input value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} required />
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">Upload Images</div>
            <input className="block w-full text-sm" type="file" accept="image/*" multiple onChange={(e) => setImages(e.target.files)} />
          </div>

          {error ? <div className="text-sm font-semibold text-red-600">{error}</div> : null}
          <Button type="submit">Submit for Approval</Button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">My Vehicle Listings</h2>
          <Button variant="secondary" onClick={() => void load()}>
            Refresh
          </Button>
        </div>

        {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

        <div className="mt-4 grid gap-3">
          {items.map((v) => (
            <div key={v._id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold">
                    {v.brand} {v.model} ({v.year})
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{v.city} • ₹{v.pricePerDay}/day</div>
                </div>
                <StatusPill value={v.status} />
              </div>
              {v.adminNote ? <div className="mt-2 text-sm text-slate-600">Admin note: {v.adminNote}</div> : null}
            </div>
          ))}
          {!loading && items.length === 0 ? <div className="text-sm text-slate-600">No listings yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}
