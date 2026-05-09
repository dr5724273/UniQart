"use client";

import { Protected } from "@/components/Protected";
import { BuyerDashboard } from "@/features/buyer/BuyerDashboard";

export default function BuyerDashboardPage() {
  return (
    <Protected role="buyer">
      <BuyerDashboard />
    </Protected>
  );
}
