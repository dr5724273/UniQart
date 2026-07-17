"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { VehicleListing } from "@/lib/types";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";

export function BuyerBrowseVehicles() {
  const [items, setItems] = useState<VehicleListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [city, setCity] = useState("");
  const [vehicleType, setVehicleType] = useState<"" | "car" | "bike">("");
  const [brand, setBrand] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [bookingVehicleId, setBookingVehicleId] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [address, setAddress] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);

  const pickupValid = Boolean(pickupDate);
  const returnValid = Boolean(returnDate);
  const dateRangeValid = !pickupValid || !returnValid || new Date(pickupDate) < new Date(returnDate);
  const bookingValid = pickupValid && returnValid && dateRangeValid && address.trim().length > 0;

  async function load() {
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      setError("Min price cannot exceed Max price.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (city) params.set("city", city);
      if (vehicleType) params.set("vehicleType", vehicleType);
      if (brand) params.set("brand", brand);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);

      const res = await apiFetch<{ items: VehicleListing[] }>(`/api/vehicles?${params.toString()}`);
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

  async function bookNow(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingVehicleId || submittingBooking || !bookingValid) return;
    setError(null);
    setSubmittingBooking(true);

    try {
      await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ vehicleId: bookingVehicleId, pickupDate, returnDate, address })
      });
      setBookingVehicleId(null);
      setPickupDate("");
      setReturnDate("");
      setAddress("");
      alert("Booking submitted successfully! Awaiting admin approval.");
    } catch (err: any) {
      setError(err?.message || "Booking failed");
    } finally {
      setSubmittingBooking(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <h2 className="text-lg font-extrabold">Filters</h2>
        <div className="mt-4 grid gap-3">
          <div>
            <label htmlFor="filter-city" className="mb-1 block text-xs font-semibold text-slate-600">City</label>
            <Input id="filter-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Bengaluru" />
          </div>
          <div>
            <label htmlFor="filter-type" className="mb-1 block text-xs font-semibold text-slate-600">Vehicle Type</label>
            <Select id="filter-type" value={vehicleType} onChange={(e) => setVehicleType(e.target.value as any)}>
              <option value="">All</option>
              <option value="car">Car</option>
              <option value="bike">Bike</option>
            </Select>
          </div>
          <div>
            <label htmlFor="filter-brand" className="mb-1 block text-xs font-semibold text-slate-600">Brand</label>
            <Input id="filter-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Hyundai" />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="filter-min" className="mb-1 block text-xs font-semibold text-slate-600">Min ₹/day</label>
              <Input id="filter-min" type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            </div>
            <div>
              <label htmlFor="filter-max" className="mb-1 block text-xs font-semibold text-slate-600">Max ₹/day</label>
              <Input id="filter-max" type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
            </div>
          </div>
          <Button onClick={() => void load()} variant="secondary" type="button">
            Apply
          </Button>
        </div>
      </Card>

      <div className="lg:col-span-2 grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Approved Vehicles</h2>
          <Button variant="secondary" onClick={() => void load()}>
            Refresh
          </Button>
        </div>

        {error ? <div className="text-sm font-semibold text-red-600" role="alert">{error}</div> : null}
        {loading ? <div className="text-sm text-slate-600">Loading…</div> : null}

        {items.map((v) => (
          <Card key={v._id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold">{v.brand} {v.model} ({v.year})</div>
                <div className="mt-1 text-sm text-slate-600">{v.city}</div>
                <div className="mt-2 text-sm text-slate-700">
                  ₹<span className="font-extrabold">{v.pricePerDay}</span>/day • Deposit ₹{v.securityDeposit}
                </div>
              </div>
              <Button onClick={() => setBookingVehicleId(v._id)}>Book Now</Button>
            </div>

            {bookingVehicleId === v._id ? (
              <form className="mt-4 grid gap-3" onSubmit={bookNow} aria-label="Book vehicle form">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label htmlFor={`pickup-${v._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Pickup date</label>
                    <Input id={`pickup-${v._id}`} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} type="date" required />
                  </div>
                  <div>
                    <label htmlFor={`return-${v._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Return date</label>
                    <Input id={`return-${v._id}`} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} type="date" required />
                  </div>
                </div>
                {!dateRangeValid && pickupValid && returnValid ? (
                  <div className="text-xs font-semibold text-red-600">Return date must be after pickup date.</div>
                ) : null}
                <div>
                  <label htmlFor={`address-${v._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Address</label>
                  <Textarea id={`address-${v._id}`} value={address} onChange={(e) => setAddress(e.target.value)} rows={3} required />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submittingBooking || !bookingValid} aria-disabled={submittingBooking || !bookingValid}>
                    {submittingBooking ? "Submitting…" : "Submit Booking"}
                  </Button>
                  <Button variant="secondary" type="button" onClick={() => setBookingVehicleId(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : null}
          </Card>
        ))}

        {!loading && items.length === 0 ? <div className="text-sm text-slate-600">No vehicles found.</div> : null}
      </div>
    </div>
  );
}
