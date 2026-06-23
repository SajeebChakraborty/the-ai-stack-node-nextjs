"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/types/domain";
import { getHomeForRole } from "@/lib/auth/portals";
import { navItems } from "@/lib/constants/navigation";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AccountMenu } from "@/components/layout/account-menu";

type HeaderUser = {
  name: string;
  email: string;
  role: Role;
};

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const dashboardPath = user ? getHomeForRole(user.role) : null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 60px", height: "62px",
      background: scrolled ? "rgba(6,9,24,0.97)" : "rgba(6,9,24,0.88)",
      backdropFilter: "blur(14px)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      position: "sticky", top: 0, zIndex: 100,
      transition: "background .3s"
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700, fontSize: "13px", letterSpacing: "1.8px", textDecoration: "none", color: "#fff" }}>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg,#7c5cff,#00d4ff)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3.5" fill="white" opacity=".9"/>
            <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1" opacity=".35" fill="none"/>
            <line x1="1" y1="8" x2="15" y2="8" stroke="white" strokeWidth=".8" opacity=".3"/>
            <line x1="8" y1="1" x2="8" y2="15" stroke="white" strokeWidth=".8" opacity=".3"/>
          </svg>
        </div>
        <span className="hidden sm:inline">THE AI STACKS</span>
      </Link>

      {/* Desktop nav */}
      <nav className="hidden lg:flex" style={{ gap: "30px", listStyle: "none" }}>
        {navItems.map(item => (
          <Link key={item.href} href={item.href} style={{
            fontSize: "13px",
            color: pathname === item.href || pathname.startsWith(item.href + "/") ? "#fff" : "rgba(255,255,255,0.72)",
            textDecoration: "none", transition: "color .2s"
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#fff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = pathname === item.href || pathname.startsWith(item.href + "/") ? "#fff" : "rgba(255,255,255,0.72)"; }}
          >
            {item.label}
          </Link>
        ))}
        {user && dashboardPath ? (
          <Link href={dashboardPath} style={{ fontSize: "13px", color: "rgba(255,255,255,0.72)", textDecoration: "none", transition: "color .2s" }}>
            Dashboard
          </Link>
        ) : null}
      </nav>

      {/* Actions */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <div className="lg:hidden">
          <MobileNav user={user} showDashboard={Boolean(user && dashboardPath)} dashboardHref={dashboardPath} />
        </div>
        {user ? (
          <AccountMenu user={user} />
        ) : (
          <>
            <Link href="/auth/login?next=/user/dashboard" style={{
              padding: "8px 18px", background: "linear-gradient(135deg,#00c6ff,#0072ff)",
              border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", textDecoration: "none", transition: "opacity .2s",
              display: "inline-block"
            }}>
              Sign in
            </Link>
            <Link href="/directory" style={{
              padding: "8px 18px", background: "transparent",
              border: "1px solid rgba(255,255,255,0.22)", borderRadius: "8px", color: "#fff",
              fontSize: "13px", fontWeight: 500, cursor: "pointer", textDecoration: "none",
              transition: "background .2s", display: "inline-block"
            }}
              className="hidden sm:inline-block"
            >
              Explore directory
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
