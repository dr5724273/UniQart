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

  const userRef = React.useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    let lastActivity = Date.now();
    let lastRefresh = Date.now();
    
    const handleActivity = () => {
      lastActivity = Date.now();
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));

    const interval = setInterval(() => {
      if (!userRef.current) return;
      
      const now = Date.now();
      const idleTime = now - lastActivity;
      
      if (idleTime >= 5 * 60 * 1000) {
        void logout();
      } else if (now - lastRefresh >= 4 * 60 * 1000) {
        apiFetch<{ token?: string }>("/api/auth/refresh", { method: "POST" })
          .then((res) => {
            if (res.token) localStorage.setItem("uniqart_token", res.token);
            lastRefresh = Date.now();
          })
          .catch(() => void logout());
      }
    }, 30000);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearInterval(interval);
    };
  }, []);

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
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.warn("Logout API failed, continuing local cleanup", e);
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
  }

  const value = useMemo(() => ({ user, loading, login, register, logout, refresh }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
