"use client";

import clsx from "clsx";

export function StatusPill({ value }: { value: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-800 ring-amber-200",
    approved: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    rejected: "bg-rose-50 text-rose-800 ring-rose-200",
    active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    suspended: "bg-rose-50 text-rose-800 ring-rose-200"
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        styles[value] || "bg-slate-100 text-slate-700 ring-slate-200"
      )}
    >
      {value.toUpperCase()}
    </span>
  );
}
