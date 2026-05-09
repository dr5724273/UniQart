"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { FinanceOffer } from "@/lib/types";
import { Button, Card, Input, Select, Textarea } from "@/components/ui";

export function BuyerBrowseFinanceOffers() {
  const [items, setItems] = useState<FinanceOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [applyOfferId, setApplyOfferId] = useState<string | null>(null);
  const [requestedAmount, setRequestedAmount] = useState("20000");
  const [durationMonths, setDurationMonths] = useState("12");
  const [employmentStatus, setEmploymentStatus] = useState("Salaried");
  const [monthlyIncome, setMonthlyIncome] = useState("50000");
  const [collateralType, setCollateralType] = useState<"vehicle" | "property" | "gold" | "other">("gold");
  const [collateralDescription, setCollateralDescription] = useState("Gold jewellery");
  const [documents, setDocuments] = useState<FileList | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ items: FinanceOffer[] }>("/api/finance-offers");
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

  async function applyLoan(e: React.FormEvent) {
    e.preventDefault();
    if (!applyOfferId) return;

    const form = new FormData();
    form.append("financeOfferId", applyOfferId);
    form.append("requestedAmount", requestedAmount);
    form.append("durationMonths", durationMonths);
    form.append("employmentStatus", employmentStatus);
    form.append("monthlyIncome", monthlyIncome);
    form.append("collateralType", collateralType);
    form.append("collateralDescription", collateralDescription);
    if (documents) Array.from(documents).forEach((f) => form.append("documents", f));

    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
    const res = await fetch(`${base}/api/loan-requests`, { method: "POST", body: form, credentials: "include" });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.error || "Apply failed");

    setApplyOfferId(null);
    alert("Loan request submitted. Await admin approval.");
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">Approved Finance Offers</h2>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? <div className="text-sm font-semibold text-red-600">{error}</div> : null}
      {loading ? <div className="text-sm text-slate-600">Loading…</div> : null}

      {items.map((o: any) => (
        <Card key={o._id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-600">Lender</div>
              <div className="text-lg font-extrabold">{o.lenderId?.name || "Lister"}</div>
              <div className="mt-2 text-sm text-slate-600">₹{o.minLoan} – ₹{o.maxLoan} • {o.interestRate}% • {o.durationMonths?.join(", ")} months</div>
              <div className="mt-1 text-sm text-slate-600">Collateral: {o.collateralRequired}</div>
            </div>
            <Button onClick={() => setApplyOfferId(o._id)}>Apply for Loan</Button>
          </div>

          {applyOfferId === o._id ? (
            <form className="mt-4 grid gap-3" onSubmit={(e) => void applyLoan(e)}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-600">Requested Amount</div>
                  <Input value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} required />
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold text-slate-600">Monthly Income</div>
                  <Input value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} required />
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600">Loan Duration</div>
                <Select value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)}>
                  {(Array.isArray(o.durationMonths) ? o.durationMonths : [3, 6, 12]).map((m: number) => (
                    <option key={m} value={String(m)}>
                      {m >= 12 ? `${m / 12} year${m === 12 ? "" : "s"}` : `${m} months`}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600">Employment Status</div>
                <Input value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)} required />
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600">Collateral Type</div>
                <Select value={collateralType} onChange={(e) => setCollateralType(e.target.value as any)}>
                  <option value="vehicle">Vehicle</option>
                  <option value="property">Property</option>
                  <option value="gold">Gold</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600">Collateral Description</div>
                <Textarea value={collateralDescription} onChange={(e) => setCollateralDescription(e.target.value)} rows={3} required />
              </div>
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600">Upload Documents</div>
                <input className="block w-full text-sm" type="file" multiple onChange={(e) => setDocuments(e.target.files)} />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Submit Loan Request</Button>
                <Button variant="secondary" type="button" onClick={() => setApplyOfferId(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}
        </Card>
      ))}

      {!loading && items.length === 0 ? <div className="text-sm text-slate-600">No offers found.</div> : null}
    </div>
  );
}
