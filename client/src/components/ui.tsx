"use client";

import React from "react";
import clsx from "clsx";

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }
) {
  const { variant = "primary", className, ...rest } = props;
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50";
  const variants = {
    primary: "bg-primary-700 text-white hover:bg-primary-800",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100"
  } as const;
  return <button className={clsx(base, variants[variant], className)} {...rest} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={clsx(
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary-500 focus:ring-2",
        className
      )}
      {...rest}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      className={clsx(
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary-500 focus:ring-2",
        className
      )}
      {...rest}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return (
    <select
      className={clsx(
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-primary-500 focus:ring-2",
        className
      )}
      {...rest}
    />
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("card p-6", className)}>{children}</div>;
}

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

export function ModeToggle({ value, onChange }: { value: "rental" | "finance"; onChange: (v: "rental" | "finance") => void }) {
  return (
    <div className="inline-flex rounded-full bg-slate-100 p-1 ring-1 ring-slate-200">
      <button
        className={clsx(
          "rounded-full px-3 py-1 text-xs font-semibold",
          value === "rental" ? "bg-white shadow-sm" : "text-slate-600"
        )}
        onClick={() => onChange("rental")}
        type="button"
      >
        RENTAL
      </button>
      <button
        className={clsx(
          "rounded-full px-3 py-1 text-xs font-semibold",
          value === "finance" ? "bg-white shadow-sm" : "text-slate-600"
        )}
        onClick={() => onChange("finance")}
        type="button"
      >
        FINANCE
      </button>
    </div>
  );
}
