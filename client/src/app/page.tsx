"use client";

import Link from "next/link";
import { useMode } from "@/context/ModeContext";
import { Button, Card } from "@/components/ui";

export default function HomePage() {
  const { mode } = useMode();

  return (
    <main>
      <section className="bg-gradient-to-b from-white to-slate-50">
        <div className="container-page py-14">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-3 inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800 ring-1 ring-primary-100">
                {mode === "rental" ? "Rental Marketplace Mode" : "Finance Marketplace Mode"}
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
                India’s Trusted Vehicle Rental & Finance Marketplace
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                Rent vehicles, earn from your vehicles, or lend money securely — all in one place.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/auth/buyer/sign-up">
                  <Button>Get Started</Button>
                </Link>
                <Link href={mode === "rental" ? "/auth/lister/sign-up" : "/auth/lister/sign-up"}>
                  <Button variant="secondary">Become a Lister</Button>
                </Link>
              </div>
            </div>

            <Card className="bg-white">
              <div className="grid gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-sm font-semibold text-slate-900">Admin-first approvals</div>
                  <div className="mt-1 text-sm text-slate-600">Nothing goes live until MyUniQart Admin approves it.</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-sm font-semibold text-slate-900">Trusted marketplace</div>
                  <div className="mt-1 text-sm text-slate-600">Role-based portals: Lister, Buyer, Admin.</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="text-sm font-semibold text-slate-900">Two global modes</div>
                  <div className="mt-1 text-sm text-slate-600">Rental and Finance views switch instantly from the top bar.</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="container-page py-12">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Choose your portal</h2>
        <p className="mt-2 text-slate-600">Login and start using MyUniQart in minutes.</p>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Card>
            <div className="text-sm font-semibold text-slate-500">Lister Portal</div>
            <div className="mt-1 text-xl font-extrabold text-slate-900">List Vehicle / Offer Finance</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/auth/lister/sign-up">
                <Button>Sign Up as Lister</Button>
              </Link>
              <Link href="/auth/lister/sign-in">
                <Button variant="secondary">Sign In</Button>
              </Link>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold text-slate-500">Buyer Portal</div>
            <div className="mt-1 text-xl font-extrabold text-slate-900">Rent Vehicle / Get Finance</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/auth/buyer/sign-up">
                <Button>Sign Up as Buyer</Button>
              </Link>
              <Link href="/auth/buyer/sign-in">
                <Button variant="secondary">Sign In</Button>
              </Link>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold text-slate-500">Admin Portal</div>
            <div className="mt-1 text-xl font-extrabold text-slate-900">Admin Dashboard</div>
            <div className="mt-4">
              <Link href="/admin/login">
                <Button>Admin Login</Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container-page py-8 text-sm text-slate-500">© {new Date().getFullYear()} MyUniQart</div>
      </footer>
    </main>
  );
}
