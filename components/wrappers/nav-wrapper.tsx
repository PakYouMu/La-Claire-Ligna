// components/wrappers/global-nav.tsx
"use client";

import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import NavOverlay from "@/components/ui/nav-overlay";

export function GlobalNav() {
  const pathname = usePathname();
  const params = useParams();
  
  const slug = params?.slug as string | undefined;

  const isFundScopedPage =
    pathname?.startsWith("/base/") &&
    Boolean(slug);

  const landingLinks = (
    <div className="flex flex-col gap-1">
      <Link href="/" className="nav-link-item">Home</Link>
      <Link href="/loan-tracking" className="nav-link-item">Track My Loans</Link>
      <Link href="/about" className="nav-link-item">About Us</Link>
    </div>
  );

  // CHANGED: Use slug in URLs
  const dashboardLinks = slug ? (
    <div className="flex flex-col gap-1">
      <Link href="/" className="nav-link-item">Funds</Link>
      <Link href={`/base/${slug}/dashboard`} className="nav-link-item">Dashboard</Link>
      <Link href={`/base/${slug}/loans`} className="nav-link-item">Loans</Link>
      <Link href={`/base/${slug}/borrowers`} className="nav-link-item">Borrowers</Link>
    </div>
  ) : null;

  return (
    <NavOverlay navItems={isFundScopedPage ? dashboardLinks : landingLinks} />
  );
}