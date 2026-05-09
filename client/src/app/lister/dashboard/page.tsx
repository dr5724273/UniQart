"use client";

import { Protected } from "@/components/Protected";
import { ListerDashboard } from "@/features/lister/ListerDashboard";

export default function ListerDashboardPage() {
  return (
    <Protected role="lister">
      <ListerDashboard />
    </Protected>
  );
}
