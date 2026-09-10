"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useMode } from "@/context/ModeContext";
import { useAuth } from "@/context/AuthContext";
import { Button, ModeToggle } from "@/components/ui";
import { AdminNotificationsBell } from "@/components/AdminNotificationsBell";
import { ArrowUpRight } from "@/components/ServiceIcon";

export function Navbar() {
  const { mode, setMode } = useMode();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = pathname === "/";
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <a href="#page-content" className="skip-link">Skip to content</a>
      <div className="home-shell header-inner">
        <Link href="/" className="brand-lockup" aria-label="MyUniQart home" onClick={closeMenu}><span className="brand-mark" aria-hidden="true">u<span>↗</span></span>MyUniQart<span className="brand-dot">.</span></Link>
        <nav className="desktop-nav" aria-label="Main navigation"><Link href="/#services">Rent a vehicle</Link><Link href="/#finance">Finance</Link><Link href="/#how-it-works">How it works</Link></nav>
        <div className="header-actions">
          {!isHome && <div className="header-mode"><ModeToggle value={mode} onChange={setMode} /></div>}
          {!user ? <><Link href="/auth/buyer/sign-in" className="header-login">Log in</Link><Link href="/auth/lister/sign-up" className="header-partner home-button home-button-dark">Become a partner <ArrowUpRight /></Link></> : <><AdminNotificationsBell /><Link className="header-login" href={`/${user.role}/dashboard`}>My account</Link><Button variant="ghost" onClick={() => { if (window.confirm("Are you sure you want to logout?")) void logout(); }}>Logout</Button></>}
          <button type="button" className="mobile-menu-button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <span aria-hidden="true">×</span> : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>}</button>
        </div>
      </div>
      {menuOpen && <nav id="mobile-navigation" className="mobile-navigation" aria-label="Mobile navigation"><Link onClick={closeMenu} href="/#services">Rent a car or bike</Link><Link onClick={closeMenu} href="/#finance">Explore finance</Link><Link onClick={closeMenu} href="/#how-it-works">How it works</Link><Link onClick={closeMenu} href={user ? `/${user.role}/dashboard` : "/auth/lister/sign-up"}>Become a partner</Link>{!user && <Link onClick={closeMenu} href="/auth/lister/sign-in">Partner sign in</Link>}{!isHome && <ModeToggle value={mode} onChange={setMode} />}</nav>}
    </header>
  );
}

