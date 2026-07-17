"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input } from "@/components/ui";

export default function AdminLogin() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const formValid = emailValid && password.length >= 8;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid) {
      setError("Please enter a valid email and password (min 8 chars).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container-page py-10">
      <Card className="mx-auto max-w-md">
        <h1 className="text-xl font-extrabold">Admin Login</h1>
        <p className="mt-1 text-sm text-slate-600">Final authority for approvals.</p>
        <form className="mt-6 grid gap-3" onSubmit={onSubmit} aria-label="Admin login form">
          <div>
            <label htmlFor="admin-email" className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
            <Input id="admin-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
            <Input id="admin-password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          {error ? <div className="text-sm font-semibold text-red-600" role="alert">{error}</div> : null}
          <Button disabled={busy || !formValid} type="submit" aria-disabled={busy || !formValid}>
            {busy ? "Signing in…" : "Sign In"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
