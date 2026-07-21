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
  const [blockedSlots, setBlockedSlots] = useState<{ pickupDate: string; returnDate: string }[]>([]);
  const [bookingTermsAccepted, setBookingTermsAccepted] = useState(false);

  const pickupValid = Boolean(pickupDate);
  const returnValid = Boolean(returnDate);
  
  const pDate = new Date(pickupDate);
  const rDate = new Date(returnDate);
  const durationHours = (rDate.getTime() - pDate.getTime()) / (1000 * 60 * 60);
  
  const dateRangeValid = !pickupValid || !returnValid || durationHours >= 4;
  
  // Check overlap
  const hasOverlap = blockedSlots.some(slot => {
    const sPickup = new Date(slot.pickupDate);
    const sReturn = new Date(slot.returnDate);
    return (pDate < sReturn && rDate > sPickup);
  });

  const bookingValid = pickupValid && returnValid && dateRangeValid && !hasOverlap && address.trim().length > 0 && bookingTermsAccepted;

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

  async function openBookingForm(vehicleId: string) {
    setBookingVehicleId(vehicleId);
    setPickupDate("");
    setReturnDate("");
    setAddress("");
    setBlockedSlots([]);
    setBookingTermsAccepted(false);
    try {
      const res = await apiFetch<{ items: { pickupDate: string; returnDate: string }[] }>(`/api/bookings/blocked/${vehicleId}`);
      setBlockedSlots(res.items);
    } catch (err) {
      console.error("Failed to load blocked slots", err);
    }
  }

  async function bookNow(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingVehicleId || submittingBooking || !bookingValid) return;
    setError(null);
    setSubmittingBooking(true);

    try {
      await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ vehicleId: bookingVehicleId, pickupDate, returnDate, address, termsAccepted: true })
      });
      setBookingVehicleId(null);
      setPickupDate("");
      setReturnDate("");
      setAddress("");
      setBookingTermsAccepted(false);
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
              <Button onClick={() => openBookingForm(v._id)}>Book Now</Button>
            </div>

            {v.termsAndConditions && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="text-xs font-semibold text-slate-600 mb-1">Terms & Conditions</div>
                <div className="text-sm text-slate-800 whitespace-pre-wrap">{v.termsAndConditions}</div>
              </div>
            )}

            {bookingVehicleId === v._id ? (
              <form className="mt-4 grid gap-3" onSubmit={bookNow} aria-label="Book vehicle form">
                {blockedSlots.length > 0 && (
                  <div className="bg-slate-100 p-3 rounded-md mb-2">
                    <p className="text-xs font-semibold text-slate-800 mb-1">Already Booked Times:</p>
                    <ul className="text-xs text-slate-600 list-disc list-inside">
                      {blockedSlots.map((s, i) => (
                        <li key={i}>
                          {new Date(s.pickupDate).toLocaleString()} to {new Date(s.returnDate).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <label htmlFor={`pickup-${v._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Pickup date & time</label>
                    <Input id={`pickup-${v._id}`} value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} type="datetime-local" required />
                  </div>
                  <div>
                    <label htmlFor={`return-${v._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Return date & time</label>
                    <Input id={`return-${v._id}`} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} type="datetime-local" required />
                  </div>
                </div>
                {!dateRangeValid && pickupValid && returnValid ? (
                  <div className="text-xs font-semibold text-red-600">Minimum booking duration is 4 hours.</div>
                ) : null}
                {hasOverlap && pickupValid && returnValid ? (
                  <div className="text-xs font-semibold text-red-600">Selected time overlaps with a booked slot.</div>
                ) : null}
                <div>
                  <label htmlFor={`address-${v._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Address</label>
                  <Textarea id={`address-${v._id}`} value={address} onChange={(e) => setAddress(e.target.value)} rows={3} required />
                </div>
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    id={`booking-terms-${v._id}`}
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                    checked={bookingTermsAccepted}
                    onChange={(e) => setBookingTermsAccepted(e.target.checked)}
                  />
                  <span className="text-sm text-slate-700">
                    I agree to the{" "}
                    <span className="font-semibold">Terms & Conditions</span>{" "}
                    {v.termsAndConditions ? "listed above" : "of this vehicle rental"} and understand the booking policy.
                  </span>
                </label>
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
