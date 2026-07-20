"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { AdminApproveVehicles, AdminApproveOffers } from "@/features/admin/AdminApprovals";
import { AdminManageBookings, AdminManageLoans } from "@/features/admin/AdminOperations";
import { AdminManageUsers } from "@/features/admin/AdminUsers";
import { AdminHistory } from "@/features/admin/AdminHistory";
import { AdminLiveOperations } from "@/features/admin/AdminLiveOperations";
import { AdminVehicleListings, AdminFinanceListings } from "@/features/admin/AdminListings";
import { apiFetch } from "@/lib/api";

type Tab = "vehicles" | "offers" | "bookings" | "loans" | "users" | "history" | "live" | "vehicle-listings" | "finance-listings";

export function AdminDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = (searchParams?.get("tab") as Tab) || "vehicles";
  const validTabs: Tab[] = ["vehicles", "offers", "bookings", "loans", "users", "history", "live", "vehicle-listings", "finance-listings"];
  const [tab, setTab] = useState<Tab>(
    validTabs.includes(tabParam as Tab) ? tabParam : "vehicles"
  );
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam as Tab)) {
      setTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    apiFetch<any>("/api/admin/dashboard")
      .then(res => setCounts(res))
      .catch(err => console.error("Failed to load dashboard counts:", err));
  }, [tab]); // Refresh counts on tab change (simulate auto-refresh on return to dashboard view)

  function handleTabChange(key: Tab) {
    setTab(key);
    router.push(`/admin/dashboard?tab=${key}`);
  }

  return (
    <main className="container-page py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">Final authority: approvals, bookings, loans, and users.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["vehicles", `Vehicles (${counts.pendingVehicles || 0})`],
            ["offers", `Finance Offers (${counts.pendingFinanceOffers || 0})`],
            ["bookings", `Bookings (${counts.pendingBookings || 0})`],
            ["loans", `Loan Requests (${counts.pendingLoanRequests || 0})`],
            ["users", "Users"],
            ["history", "History"],
            ["live", "Live Operations"],
            ["vehicle-listings", "Vehicle Listings"],
            ["finance-listings", "Finance Listings"]
          ] as const
        ).map(([key, label]) => (
          <Button key={key} variant={tab === key ? "primary" : "secondary"} onClick={() => handleTabChange(key as Tab)}>
            {label}
          </Button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "vehicles" ? <AdminApproveVehicles /> : null}
        {tab === "offers" ? <AdminApproveOffers /> : null}
        {tab === "bookings" ? <AdminManageBookings /> : null}
        {tab === "loans" ? <AdminManageLoans /> : null}
        {tab === "users" ? <AdminManageUsers /> : null}
        {tab === "history" ? <AdminHistory /> : null}
        {tab === "live" ? <AdminLiveOperations /> : null}
        {tab === "vehicle-listings" ? <AdminVehicleListings /> : null}
        {tab === "finance-listings" ? <AdminFinanceListings /> : null}
      </div>
    </main>
  );
}
