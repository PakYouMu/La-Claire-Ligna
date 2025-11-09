import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  
  return (
    <div className="w-full max-w-5xl px-5">
      <h1 className="font-serif text-[clamp(2rem,8vw,4rem)] leading-tight text-center">
        <span>WHERE YOU KEEP</span><br />
        <span>YOUR FINANCES</span><br />
        <span>STRAIGHT</span>
      </h1>
    </div>
  );
}