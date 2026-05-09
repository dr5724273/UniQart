"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input } from "@/components/ui";

export default function BuyerSignUp() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register({ name, email, phone, password, role: "buyer" });
      router.push("/buyer/dashboard");
    } catch (err: any) {
      setError(err?.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container-page py-10">
      <Card className="mx-auto max-w-md">
        <h1 className="text-xl font-extrabold">Buyer Sign Up</h1>
        <p className="mt-1 text-sm text-slate-600">Phone number is mandatory.</p>
        <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">Full name</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">Email</div>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">Phone</div>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">Password</div>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          {error ? <div className="text-sm font-semibold text-red-600">{error}</div> : null}
          <Button disabled={busy} type="submit">
            {busy ? "Creating…" : "Create account"}
          </Button>
        </form>
        <div className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-primary-700" href="/auth/buyer/sign-in">
            Sign in
          </Link>
        </div>
      </Card>
    </main>
  );
}
