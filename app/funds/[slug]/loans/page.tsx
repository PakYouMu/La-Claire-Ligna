import { getFundBySlug } from "@/app/actions/funds";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoansBentoWrapper } from "@/components/loans/loans-grid";
import { ActiveLoansTable } from "@/components/dashboard/active-loans-table"; // Ensure correct import

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LoansPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const result = await getFundBySlug(slug);

  if (!result.success || !result.data) {
    redirect(`/funds/error?message=${encodeURIComponent(result.error || "Fund not found")}`);
  }

  const fund = result.data;

  return (
    <div className="w-full pt-16 md:pt-[123px]">
      <LoansBentoWrapper>
        <ActiveLoansTable fundId={fund.id} />
      </LoansBentoWrapper>
    </div>
  );
}