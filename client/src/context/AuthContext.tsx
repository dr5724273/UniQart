"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Role, User } from "@/lib/types";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; phone: string; password: string; role: Exclude<Role, "admin"> }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await apiFetch<{ user: User; token?: string }>("/api/auth/me");
      setUser(res.user);
      if (typeof window !== "undefined" && res.token) {
        localStorage.setItem("uniqart_token", res.token);
      }
    } catch {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("uniqart_token");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function login(email: string, password: string) {
    const res = await apiFetch<{ user: User; token?: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    setUser(res.user);
    if (typeof window !== "undefined" && res.token) {
      localStorage.setItem("uniqart_token", res.token);
    }
  }

  async function register(payload: { name: string; email: string; phone: string; password: string; role: Exclude<Role, "admin"> }) {
    await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    await login(payload.email, payload.password);
  }

  async function logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("uniqart_token");
    }
    await apiFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, register, logout, refresh }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
