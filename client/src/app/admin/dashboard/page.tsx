"use client";

import { Suspense } from "react";
import { Protected } from "@/components/Protected";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export default function AdminDashboardPage() {
  return (
    <Protected role="admin">
      <Suspense fallback={<div className="container-page py-8 text-sm text-slate-600">Loading dashboard…</div>}>
        <AdminDashboard />
      </Suspense>
    </Protected>
  );
}
