import type { SVGProps } from "react";

export function ArrowUpRight() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10" /></svg>;
}

export function ServiceIcon({ type, ...props }: SVGProps<SVGSVGElement> & { type: "car" | "bike" | "finance" | "check" | "key" }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {type === "car" && <><path d="m5 7 1-3h12l1 3 2 5v7h-3v-3H6v3H3v-7l2-5Zm0 0h14M3 12h18" /><path d="M6 13v1m12-1v1" /></>}
    {type === "bike" && <><circle cx="5" cy="17" r="4" /><circle cx="19" cy="17" r="4" /><path d="m5 17 5-9 5 9H5l6-6h6m2 6L15 4h-3M8 8h5" /></>}
    {type === "finance" && <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 10h18m-6 5h3M7 5V3h10v2" /></>}
    {type === "check" && <><path d="m12 2 8 3v6c0 5-8 10-8 10S4 16 4 11V5l8-3Z" /><path d="m8 11 3 3 5-6" /></>}
    {type === "key" && <><circle cx="8" cy="8" r="5" /><path d="m12 12 9 9m-3-3 3-3m-6 0 3-3M7 7h.01" /></>}
  </svg>;
}

