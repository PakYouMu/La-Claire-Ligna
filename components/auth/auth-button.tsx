import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/ui/logout-button";
import { getUserRole } from "@/lib/auth-helpers";

export async function AuthButton() {
  const supabase = await createClient();

  // 1. SECURITY IMPROVEMENT: Use getUser() instead of getClaims()
  // This validates the user's token with the Supabase Auth server.
  // If the user was banned 1 second ago, this will return null immediately.
  const { data: { user } } = await supabase.auth.getUser();

  // 2. If not logged in, show Sign In/Up
  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant={"default"}>
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  // 3. Fetch Role for Custom Greeting
  // We reuse the helper we made earlier to check the 'profiles' table
  const role = await getUserRole();

  let greetingName = "Admin"; // Default fallback
  if (role === 'superuser') {
    greetingName = "Boss";
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-muted-foreground">
        Welcome back, <span className="text-foreground font-bold">{greetingName}</span>
      </span>
      <LogoutButton />
    </div>
  );
}