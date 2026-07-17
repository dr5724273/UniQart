"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { AdminApproveVehicles, AdminApproveOffers } from "@/features/admin/AdminApprovals";
import { AdminManageBookings, AdminManageLoans } from "@/features/admin/AdminOperations";
import { AdminManageUsers } from "@/features/admin/AdminUsers";

type Tab = "vehicles" | "offers" | "bookings" | "loans" | "users";

export function AdminDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = (searchParams?.get("tab") as Tab) || "vehicles";
  const [tab, setTab] = useState<Tab>(
    ["vehicles", "offers", "bookings", "loans", "users"].includes(tabParam) ? tabParam : "vehicles"
  );

  useEffect(() => {
    if (tabParam && ["vehicles", "offers", "bookings", "loans", "users"].includes(tabParam)) {
      setTab(tabParam);
    }
  }, [tabParam]);

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
            ["vehicles", "Approve Vehicle Listings"],
            ["offers", "Approve Finance Offers"],
            ["bookings", "Booking Management"],
            ["loans", "Loan Requests"],
            ["users", "User Management"]
          ] as const
        ).map(([key, label]) => (
          <Button key={key} variant={tab === key ? "primary" : "secondary"} onClick={() => handleTabChange(key)}>
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
      </div>
    </main>
  );
}
