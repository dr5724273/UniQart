"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input } from "@/components/ui";

export default function ListerSignUp() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneValid = /^\+?[0-9\s-]{7,15}$/.test(phone);
  const formValid = name.trim().length > 0 && emailValid && phoneValid && password.length >= 8;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid) {
      setError("Please ensure name, valid email, valid phone, and password (min 8 chars) are entered.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register({ name, email, phone, password, role: "lister" });
      router.push("/lister/dashboard");
    } catch (err: any) {
      setError(err?.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container-page py-10">
      <Card className="mx-auto max-w-md">
        <h1 className="text-xl font-extrabold">Lister Sign Up</h1>
        <p className="mt-1 text-sm text-slate-600">Phone number is mandatory.</p>
        <form className="mt-6 grid gap-3" onSubmit={onSubmit} aria-label="Lister sign up form">
          <div>
            <label htmlFor="lister-name" className="mb-1 block text-xs font-semibold text-slate-600">Full name</label>
            <Input id="lister-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="lister-signup-email" className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
            <Input id="lister-signup-email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label htmlFor="lister-phone" className="mb-1 block text-xs font-semibold text-slate-600">Phone</label>
            <Input id="lister-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="lister-signup-password" className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
            <Input id="lister-signup-password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          {error ? <div className="text-sm font-semibold text-red-600" role="alert">{error}</div> : null}
          <Button disabled={busy || !formValid} type="submit" aria-disabled={busy || !formValid}>
            {busy ? "Creating…" : "Create account"}
          </Button>
        </form>
        <div className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-primary-700" href="/auth/lister/sign-in">
            Sign in
          </Link>
        </div>
      </Card>
    </main>
  );
}
