"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import NavOverlay from "@/components/ui/nav-overlay";

export function GlobalNav() {
  const pathname = usePathname();
  const params = useParams();
  
  const slug = params?.slug as string | undefined;

  // 1. Detect Context
  const isAppRoute = pathname?.startsWith("/funds");

  // 2. Public Links (Landing Page)
  const landingLinks = (
    <div className="flex flex-col gap-1">
      <Link href="/" className="nav-link-item">Home</Link>
      <Link href="/loan-tracking" className="nav-link-item">Track My Loans</Link>
      <Link href="/about" className="nav-link-item">About Us</Link>
    </div>
  );

  // 3. Fund Dashboard Links (Inside a specific fund)
  const dashboardLinks = (
    <div className="flex flex-col gap-1">
      <Link href="/funds" className="nav-link-item">Funds</Link>
      <Link href={`/funds/${slug}/dashboard`} className="nav-link-item">Dashboard</Link>
      <Link href={`/funds/${slug}/loans`} className="nav-link-item">Loans</Link>
      <Link href={`/funds/${slug}/borrowers`} className="nav-link-item">Borrowers</Link>
    </div>
  );

  // 4. Selector Links (Logged in, but no fund selected yet)
  const selectorLinks = (
    <div className="flex flex-col gap-1">
      <Link href="/funds" className="nav-link-item">Select Fund</Link>
      {/* You can add 'Profile' or 'Settings' here if you want explicit links */}
    </div>
  );

  // 5. Determine which set to show
  let activeNavItems;

  if (isAppRoute) {
    // If we have a slug, we are deep in the app -> Dashboard Links
    // If not, we are just picking a fund -> Selector Links
    activeNavItems = slug ? dashboardLinks : selectorLinks;
  } else {
    // We are on public pages -> Landing Links
    activeNavItems = landingLinks;
  }

  return (
    <NavOverlay navItems={activeNavItems} />
  );
}