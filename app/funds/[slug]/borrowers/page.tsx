import { getFundBySlug } from "@/app/actions/funds";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoansBentoWrapper } from "@/components/loans/loans-grid";
import { BorrowerList } from "@/components/dashboard/borrower-list";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LoansPage({ params }: PageProps) {
  // 1. Await params
  const { slug } = await params;

  // 2. Auth Check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 3. Resolve Slug -> Fund ID
  const fund = await getFundBySlug(slug);

  if (!fund) {
    return notFound();
  }

  return (
    <div className="w-full pt-16 md:pt-[123px]">
      <LoansBentoWrapper>
        {/* Pass the fund.id explicitly to scope the data fetching */}
        <BorrowerList fundId={fund.id} /> 
      </LoansBentoWrapper>
    </div>
  );
}