"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { FinanceOffer } from "@/lib/types";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { StatusPill } from "@/components/StatusPill";

export function ListerFinanceOffers() {
  const [items, setItems] = useState<FinanceOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [totalAmount, setTotalAmount] = useState("200000");
  const [minLoan, setMinLoan] = useState("10000");
  const [maxLoan, setMaxLoan] = useState("50000");
  const [interestRate, setInterestRate] = useState("18");
  const [durationMonths, setDurationMonths] = useState({ m3: true, m6: true, m12: true });
  const [terms, setTerms] = useState("KYC required. Collateral verification by MyUniQart admin.");

  const durations = useMemo(() => {
    const d: number[] = [];
    if (durationMonths.m3) d.push(3);
    if (durationMonths.m6) d.push(6);
    if (durationMonths.m12) d.push(12);
    return d;
  }, [durationMonths]);

  const totalNum = Number(totalAmount);
  const minNum = Number(minLoan);
  const maxNum = Number(maxLoan);
  const rateNum = Number(interestRate);
  const formValid =
    !isNaN(totalNum) &&
    totalNum > 0 &&
    !isNaN(minNum) &&
    minNum > 0 &&
    !isNaN(maxNum) &&
    maxNum >= minNum &&
    !isNaN(rateNum) &&
    rateNum >= 0 &&
    durations.length > 0 &&
    terms.trim().length > 0 &&
    termsAccepted;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ items: FinanceOffer[] }>("/api/finance-offers/mine");
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

  async function createOffer(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !formValid) return;
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch("/api/finance-offers", {
        method: "POST",
        body: JSON.stringify({
          totalAmount: Number(totalAmount),
          minLoan: Number(minLoan),
          maxLoan: Number(maxLoan),
          interestRate: Number(interestRate),
          durationMonths: durations,
          collateralRequired: "other",
          terms,
          termsAccepted: true
        })
      });
      await load();
    } catch (err: any) {
      setError(err?.message || "Create failed");
    } finally {
      setSubmitting(false);
      setTermsAccepted(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="text-lg font-extrabold">Create Finance Offer</h2>
        <p className="mt-1 text-sm text-slate-600">Starts as pending until admin approves.</p>

        <form className="mt-4 grid gap-3" onSubmit={createOffer} aria-label="Create finance offer form">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="offer-total" className="mb-1 block text-xs font-semibold text-slate-600">Total Lending Amount</label>
              <Input id="offer-total" type="number" min="1" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="offer-rate" className="mb-1 block text-xs font-semibold text-slate-600">Interest Rate (%)</label>
              <Input id="offer-rate" type="number" min="0" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="offer-min" className="mb-1 block text-xs font-semibold text-slate-600">Min Loan</label>
              <Input id="offer-min" type="number" min="1" value={minLoan} onChange={(e) => setMinLoan(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="offer-max" className="mb-1 block text-xs font-semibold text-slate-600">Max Loan</label>
              <Input id="offer-max" type="number" min="1" value={maxLoan} onChange={(e) => setMaxLoan(e.target.value)} required />
            </div>
          </div>
          {!isNaN(minNum) && !isNaN(maxNum) && minNum > maxNum ? (
            <div className="text-xs font-semibold text-red-600">Min Loan cannot exceed Max Loan.</div>
          ) : null}

          <div>
            <span className="mb-1 block text-xs font-semibold text-slate-600">Loan Duration Options</span>
            <div className="flex flex-wrap gap-3 text-sm" role="group" aria-label="Loan duration options">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={durationMonths.m3} onChange={(e) => setDurationMonths((s) => ({ ...s, m3: e.target.checked }))} />
                3 months
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={durationMonths.m6} onChange={(e) => setDurationMonths((s) => ({ ...s, m6: e.target.checked }))} />
                6 months
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={durationMonths.m12} onChange={(e) => setDurationMonths((s) => ({ ...s, m12: e.target.checked }))} />
                12 months
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="offer-terms" className="mb-1 block text-xs font-semibold text-slate-600">Terms & Conditions</label>
            <Textarea id="offer-terms" value={terms} onChange={(e) => setTerms(e.target.value)} rows={5} required />
          </div>

          <label className="flex items-start gap-2 cursor-pointer select-none">
            <input
              id="offer-terms-accept"
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span className="text-sm text-slate-700">
              I agree to the{" "}
              <span className="font-semibold">MyUniQart Platform Terms & Conditions</span>{" "}
              and confirm my finance offer details are accurate.
            </span>
          </label>

          {error ? <div className="text-sm font-semibold text-red-600" role="alert">{error}</div> : null}
          <Button type="submit" disabled={submitting || !formValid} aria-disabled={submitting || !formValid}>
            {submitting ? "Submitting…" : "Submit for Approval"}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold">My Finance Offers</h2>
          <Button variant="secondary" onClick={() => void load()}>
            Refresh
          </Button>
        </div>

        {loading ? <div className="mt-4 text-sm text-slate-600">Loading…</div> : null}

        <div className="mt-4 grid gap-3">
          {items.map((o: any) => (
            <div key={o._id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-extrabold">₹{o.minLoan} – ₹{o.maxLoan}</div>
                  <div className="mt-1 text-sm text-slate-600">Interest {o.interestRate}% • {o.durationMonths?.join(", ")} months</div>
                </div>
                <StatusPill value={o.status} />
              </div>
              {o.adminNote ? <div className="mt-2 text-sm text-slate-600">Admin note: {o.adminNote}</div> : null}
            </div>
          ))}
          {!loading && items.length === 0 ? <div className="text-sm text-slate-600">No finance offers yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}
