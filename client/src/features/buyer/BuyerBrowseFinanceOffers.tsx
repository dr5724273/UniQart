"use client";

import { useEffect, useState } from "react";
import { apiFetch, apiFetchFormData } from "@/lib/api";
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
  const [submitting, setSubmitting] = useState(false);

  const activeOffer = items.find((i) => i._id === applyOfferId);
  const reqNum = Number(requestedAmount);
  const incNum = Number(monthlyIncome);
  const rangeValid =
    !activeOffer ||
    (!isNaN(reqNum) && reqNum >= activeOffer.minLoan && reqNum <= activeOffer.maxLoan);
  const formValid =
    rangeValid &&
    !isNaN(reqNum) &&
    reqNum > 0 &&
    !isNaN(incNum) &&
    incNum > 0 &&
    employmentStatus.trim().length > 0 &&
    collateralDescription.trim().length > 0;

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
    if (!applyOfferId || submitting || !formValid) return;
    setSubmitting(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("financeOfferId", applyOfferId);
      form.append("requestedAmount", requestedAmount);
      form.append("durationMonths", durationMonths);
      form.append("employmentStatus", employmentStatus);
      form.append("monthlyIncome", monthlyIncome);
      form.append("collateralType", collateralType);
      form.append("collateralDescription", collateralDescription);
      if (documents) Array.from(documents).forEach((f) => form.append("documents", f));

      await apiFetchFormData("/api/loan-requests", form);

      setApplyOfferId(null);
      alert("Loan request submitted successfully! Awaiting admin approval.");
    } catch (err: any) {
      setError(err?.message || "Apply failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">Approved Finance Offers</h2>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error ? <div className="text-sm font-semibold text-red-600" role="alert">{error}</div> : null}
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
            <form className="mt-4 grid gap-3" onSubmit={applyLoan} aria-label="Apply for loan form">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label htmlFor={`req-amount-${o._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Requested Amount (₹{o.minLoan} – ₹{o.maxLoan})</label>
                  <Input id={`req-amount-${o._id}`} type="number" min={o.minLoan} max={o.maxLoan} value={requestedAmount} onChange={(e) => setRequestedAmount(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor={`monthly-inc-${o._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Monthly Income</label>
                  <Input id={`monthly-inc-${o._id}`} type="number" min="1" value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} required />
                </div>
              </div>
              {!rangeValid && !isNaN(reqNum) ? (
                <div className="text-xs font-semibold text-red-600">Requested amount must be between ₹{o.minLoan} and ₹{o.maxLoan}.</div>
              ) : null}
              <div>
                <label htmlFor={`duration-${o._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Loan Duration</label>
                <Select id={`duration-${o._id}`} value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)}>
                  {(Array.isArray(o.durationMonths) ? o.durationMonths : [3, 6, 12]).map((m: number) => (
                    <option key={m} value={String(m)}>
                      {m >= 12 ? `${m / 12} year${m === 12 ? "" : "s"}` : `${m} months`}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor={`emp-status-${o._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Employment Status</label>
                <Input id={`emp-status-${o._id}`} value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)} required />
              </div>
              <div>
                <label htmlFor={`col-type-${o._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Collateral Type</label>
                <Select id={`col-type-${o._id}`} value={collateralType} onChange={(e) => setCollateralType(e.target.value as any)}>
                  <option value="vehicle">Vehicle</option>
                  <option value="property">Property</option>
                  <option value="gold">Gold</option>
                  <option value="other">Other</option>
                </Select>
              </div>
              <div>
                <label htmlFor={`col-desc-${o._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Collateral Description</label>
                <Textarea id={`col-desc-${o._id}`} value={collateralDescription} onChange={(e) => setCollateralDescription(e.target.value)} rows={3} required />
              </div>
              <div>
                <label htmlFor={`docs-${o._id}`} className="mb-1 block text-xs font-semibold text-slate-600">Upload Documents</label>
                <input id={`docs-${o._id}`} className="block w-full text-sm" type="file" multiple onChange={(e) => setDocuments(e.target.files)} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting || !formValid} aria-disabled={submitting || !formValid}>
                  {submitting ? "Submitting…" : "Submit Loan Request"}
                </Button>
                <Button variant="secondary" type="button" onClick={() => setApplyOfferId(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}
        </Card>
      ))}

      {!loading && items.length === 0 ? <div className="text-sm text-slate-600">No finance offers found.</div> : null}
    </div>
  );
}
