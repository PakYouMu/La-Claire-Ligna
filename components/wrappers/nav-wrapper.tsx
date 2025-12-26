"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import NavOverlay from "@/components/landing-page/nav-overlay";

export function GlobalNav() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  const landingLinks = (
    <div className="flex flex-col gap-1">
      <Link href="/" className="nav-link-item">Home</Link>
      <Link href="/#features" className="nav-link-item">Track My Loans</Link>
      <Link href="/#about" className="nav-link-item">About Us</Link>
    </div>
  );

  const dashboardLinks = (
    <div className="flex flex-col gap-1">
      <Link href="/dashboard" className="nav-link-item">Dashboard</Link>
      <Link href="/dashboard/loans" className="nav-link-item">Loans</Link>
      <Link href="/dashboard/borrowers" className="nav-link-item">Borrowers</Link>
    </div>
  );

  return (
    <NavOverlay navItems={isDashboard ? dashboardLinks : landingLinks} />
  );
}