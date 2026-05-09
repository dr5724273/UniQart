"use client";

import { useEffect, useMemo, useState } from "react";
import { useMode } from "@/context/ModeContext";
import { Button } from "@/components/ui";
import { ListerVehicleListings } from "@/features/lister/ListerVehicleListings";
import { ListerFinanceOffers } from "@/features/lister/ListerFinanceOffers";
import { ListerBookings } from "@/features/lister/ListerBookings";
import { ListerLoanRequests } from "@/features/lister/ListerLoanRequests";

type Tab = "vehicleListings" | "financeOffers" | "bookings" | "loanRequests" | "earnings" | "profile";

export function ListerDashboard() {
  const { mode } = useMode();
  const [tab, setTab] = useState<Tab>(mode === "finance" ? "financeOffers" : "vehicleListings");

  useEffect(() => {
    setTab(mode === "finance" ? "financeOffers" : "vehicleListings");
  }, [mode]);

  const tabs = useMemo(
    () =>
      [
        ["vehicleListings", "My Vehicle Listings"],
        ["financeOffers", "My Finance Offers"],
        ["bookings", "Booking Requests"],
        ["loanRequests", "Loan Requests"],
        ["earnings", "Earnings"],
        ["profile", "Profile"]
      ] as const,
    []
  );

  return (
    <main className="container-page py-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Lister Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Admin approval required for all listings and offers.</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <Button key={key} variant={tab === key ? "primary" : "secondary"} onClick={() => setTab(key)}>
            {label}
          </Button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "vehicleListings" ? <ListerVehicleListings /> : null}
        {tab === "financeOffers" ? <ListerFinanceOffers /> : null}
        {tab === "bookings" ? <ListerBookings /> : null}
        {tab === "loanRequests" ? <ListerLoanRequests /> : null}
        {tab === "earnings" ? (
          <div className="card p-6">
            <h2 className="text-lg font-extrabold">Earnings</h2>
            <p className="mt-1 text-sm text-slate-600">Wire up payouts/settlements here (placeholder).</p>
          </div>
        ) : null}
        {tab === "profile" ? (
          <div className="card p-6">
            <h2 className="text-lg font-extrabold">Profile</h2>
            <p className="mt-1 text-sm text-slate-600">Profile editing can be added next (placeholder).</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
