"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";

export function Protected({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (role === "admin") router.replace("/admin/login");
      else router.replace(`/auth/${role}/sign-in`);
      return;
    }
    if (user.role !== role) {
      router.replace("/");
    }
  }, [loading, user, role, router]);

  if (loading) return <div className="container-page py-10 text-sm text-slate-600">Loading…</div>;
  if (!user || user.role !== role) return null;

  return <>{children}</>;
}
