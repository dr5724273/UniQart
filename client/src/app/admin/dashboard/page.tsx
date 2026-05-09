"use client";

import { Protected } from "@/components/Protected";
import { AdminDashboard } from "@/features/admin/AdminDashboard";

export default function AdminDashboardPage() {
  return (
    <Protected role="admin">
      <AdminDashboard />
    </Protected>
  );
}
