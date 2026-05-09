"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input } from "@/components/ui";

export default function BuyerSignIn() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/buyer/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container-page py-10">
      <Card className="mx-auto max-w-md">
        <h1 className="text-xl font-extrabold">Buyer Sign In</h1>
        <p className="mt-1 text-sm text-slate-600">Rent vehicles or apply for loans.</p>
        <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">Password</div>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          {error ? <div className="text-sm font-semibold text-red-600">{error}</div> : null}
          <Button disabled={busy} type="submit">
            {busy ? "Signing in…" : "Sign In"}
          </Button>
        </form>
        <div className="mt-4 text-sm text-slate-600">
          New here?{" "}
          <Link className="font-semibold text-primary-700" href="/auth/buyer/sign-up">
            Create an account
          </Link>
        </div>
      </Card>
    </main>
  );
}
