import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ActiveLoansTable } from "@/components/dashboard/active-loans-table"
import { LoansBentoWrapper } from "@/components/loans/loans-grid";

interface PageProps {
  params: { fundId: string };
}

export default async function LoansPage({params} : PageProps) {
  const supabase = await createClient();
  const { fundId } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="w-full pt-16 md:pt-[123px]">
      <LoansBentoWrapper>
        <ActiveLoansTable fundId={fundId}/>
      </LoansBentoWrapper>  
    </div>
  );
}