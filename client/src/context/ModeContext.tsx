"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Mode = "rental" | "finance";

type ModeCtx = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  toggle: () => void;
};

const ModeContext = createContext<ModeCtx | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("rental");

  useEffect(() => {
    const raw = window.localStorage.getItem("uniqart_mode");
    if (raw === "rental" || raw === "finance") setModeState(raw);
  }, []);

  function setMode(next: Mode) {
    setModeState(next);
    window.localStorage.setItem("uniqart_mode", next);
  }

  function toggle() {
    setMode(mode === "rental" ? "finance" : "rental");
  }

  const value = useMemo(() => ({ mode, setMode, toggle }), [mode]);

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
