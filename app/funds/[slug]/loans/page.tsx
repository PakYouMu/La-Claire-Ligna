import { getFundBySlug } from "@/app/actions/funds";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoansBentoWrapper } from "@/components/loans/loans-grid";
import { ActiveLoansTable } from "@/components/dashboard/active-loans-table"

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LoansPage({ params }: PageProps) {
  // 1. Await params (Next.js 15+ requirement)
  const { slug } = await params;

  // 2. Auth Check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 3. Resolve Slug -> Fund ID
  // We need the ID because the database tables use UUIDs, not slugs
  const fund = await getFundBySlug(slug);

  if (!fund) {
    return notFound(); // Show 404 if slug is invalid (e.g. /funds/potato/loans)
  }

  return (
    <div className="w-full pt-16 md:pt-[123px]">
      <LoansBentoWrapper>
        {/* 4. Pass the RESOLVED UUID to the table */}
        <ActiveLoansTable fundId={fund.id} />
      </LoansBentoWrapper>
    </div>
  );
}