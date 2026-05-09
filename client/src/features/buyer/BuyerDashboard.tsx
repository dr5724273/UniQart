"use client";

import { useEffect, useMemo, useState } from "react";
import { useMode } from "@/context/ModeContext";
import { Button } from "@/components/ui";
import { BuyerBrowseVehicles } from "@/features/buyer/BuyerBrowseVehicles";
import { BuyerBrowseFinanceOffers } from "@/features/buyer/BuyerBrowseFinanceOffers";
import { BuyerMyBookings } from "@/features/buyer/BuyerMyBookings";
import { BuyerMyLoans } from "@/features/buyer/BuyerMyLoans";

type Tab = "browse" | "myBookings" | "myLoans" | "profile";

export function BuyerDashboard() {
  const { mode } = useMode();
  const [tab, setTab] = useState<Tab>("browse");

  const tabs = useMemo(() => {
    if (mode === "rental") {
      return [
        ["browse", "Browse Vehicles"],
        ["myBookings", "My Bookings"],
        ["profile", "Profile"]
      ] as const;
    }

    return [
      ["browse", "Browse Finance Offers"],
      ["myLoans", "My Loan Requests"],
      ["profile", "Profile"]
    ] as const;
  }, [mode]);

  useEffect(() => {
    setTab("browse");
  }, [mode]);

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Buyer Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">
        {mode === "rental" ? "Rent verified vehicles." : "Apply for loans from approved lenders."}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map(([key, label]) => (
          <Button key={key} variant={tab === key ? "primary" : "secondary"} onClick={() => setTab(key)}>
            {label}
          </Button>
        ))}
      </div>

      <div className="mt-6">
        {mode === "rental" && tab === "browse" ? <BuyerBrowseVehicles /> : null}
        {mode === "finance" && tab === "browse" ? <BuyerBrowseFinanceOffers /> : null}
        {tab === "myBookings" ? <BuyerMyBookings /> : null}
        {tab === "myLoans" ? <BuyerMyLoans /> : null}
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
