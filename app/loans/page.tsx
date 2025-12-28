import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ActiveLoansTable } from "@/components/dashboard/active-loans-table"
import { LoansBentoWrapper } from "@/components/loans/loans-grid";

export default async function LoansPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    // 1. The Top Spacer
    // This pushes the content down below the Nav Overlay.
    // We match the Dashboard's "pt-16 md:pt-[123px]" exactly.
    <div className="w-full pt-16 md:pt-[123px]">
      
      {/* 2. The Bento Wrapper
          This adds the standard p-responsive margins 
          so it aligns vertically with Dashboard widgets. 
      */}
      <LoansBentoWrapper>
        <ActiveLoansTable />
      </LoansBentoWrapper>
      
    </div>
  );
}