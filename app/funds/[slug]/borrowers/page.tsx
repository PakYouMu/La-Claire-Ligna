import { redirect } from "next/navigation";
import { getFundBySlug } from "@/app/actions/funds";
import { createClient } from "@/lib/supabase/server";
import { BorrowerList } from "@/components/dashboard/borrower-list";
import { BorrowersBentoWrapper } from "@/components/borrowers/borrowers-grid";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BorrowersPage({ params }: PageProps) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 1. Fetch the result wrapper
  const result = await getFundBySlug(slug);

  // 2. Check success and redirect on error
  if (!result.success || !result.data) {
    redirect(`/funds/error?message=${encodeURIComponent(result.error || "Fund not found")}`);
  }

  // 3. Unwrap the data to access the real Fund object
  const fund = result.data;

  return (
    <div className="w-full min-h-[100dvh] flex flex-col pt-16 md:pt-[123px]">
      <div className="w-full flex-1 flex flex-col">
        {/* Adjust translate-y-[-20px] below to move the grid up or down */}
        <div className="w-full my-auto translate-y-[-40px]">
          <BorrowersBentoWrapper>
            {/* You don't need the h1 here anymore if it's inside the card header, 
                 or you can keep it outside if you prefer the title above the bento box */}
            <BorrowerList fundId={fund.id} />
          </BorrowersBentoWrapper>
        </div>
      </div>
    </div>
  );
}
