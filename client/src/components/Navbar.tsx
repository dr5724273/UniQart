"use client";

import Link from "next/link";
import { useMode } from "@/context/ModeContext";
import { useAuth } from "@/context/AuthContext";
import { Button, ModeToggle } from "@/components/ui";
import { AdminNotificationsBell } from "@/components/AdminNotificationsBell";

export function Navbar() {
  const { mode, setMode } = useMode();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-primary-800">
          UniQart
        </Link>

        <div className="flex items-center gap-3">
          <ModeToggle value={mode} onChange={setMode} />

          {!user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/auth/buyer/sign-in">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/auth/buyer/sign-up">
                <Button>Sign Up</Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AdminNotificationsBell />
              <span className="hidden text-sm font-semibold text-slate-700 sm:inline">{user.name}</span>
              <Button
                variant="secondary"
                onClick={() => {
                  if (window.confirm("Are you sure you want to logout?")) {
                    void logout();
                  }
                }}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
