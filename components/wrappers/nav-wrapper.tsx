"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import NavOverlay from "@/components/ui/nav-overlay";

export function GlobalNav() {
  const pathname = usePathname();

  // Define all routes that should display the "Dashboard" navigation
  const appRoutes = ["/dashboard", "/loans", "/borrowers", "/settings", "/settings/profile"];
  
  // Check if the current path starts with ANY of the app routes
  const isAppPage = appRoutes.some((route) => pathname?.startsWith(route));

  const landingLinks = (
    <div className="flex flex-col gap-1">
      <Link href="/" className="nav-link-item">Home</Link>
      <Link href="/#loan-tracking" className="nav-link-item">Track My Loans</Link>
      <Link href="/#about" className="nav-link-item">About Us</Link>
    </div>
  );

  const dashboardLinks = (
    <div className="flex flex-col gap-1">
      <Link href="/dashboard" className="nav-link-item">Dashboard</Link>
      <Link href="/loans" className="nav-link-item">Loans</Link>
      <Link href="/borrowers" className="nav-link-item">Borrowers</Link>
    </div>
  );

  // Pass dashboardLinks if we are on an app page, otherwise landingLinks
  return (
    <NavOverlay navItems={isAppPage ? dashboardLinks : landingLinks} />
  );
}