import { getUserFunds } from "@/app/actions/funds";
import { FundGrid } from "@/components/fund-selector/fund-grid";
import MetallicSheen from "@/components/wrappers/metallic-sheen-wrapper";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function FundSelectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

   const result = await getUserFunds();

  if (!result.success) {
    const realError = result.error || "Unknown Error";
    redirect(`/funds/error?message=${encodeURIComponent(realError)}`);
  }


  const funds = result.data || [];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-6 pt-16 md:pt-[123px]">
      {/* <div className="relative w-full h-full pt-16 md:pt-[123px]"/> */}
      {/* Header Section */}
      <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <MetallicSheen>
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">
            Select Workspace
          </h1>
        </MetallicSheen>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Choose a fund to manage or create a new one to start tracking a separate portfolio.
        </p>
      </div>

      {/* Grid Section */}
      <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <FundGrid funds={funds} />
      </div>

      {/* Footer / Logout hint */}
      <div className="mt-12 text-sm text-muted-foreground/50 animate-in fade-in duration-1000 delay-300">
        Logged in as {user.email}
      </div>

    </div>
  );
}