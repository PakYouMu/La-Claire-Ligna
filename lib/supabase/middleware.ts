// root/lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  // 1. Initialize the response object
  let supabaseResponse = NextResponse.next({
    request,
  });

  // 2. Create the Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request cookies
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Update response cookies
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Get the user
  // We fetch this here so we don't have to fetch it again in middleware.ts
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Return the custom object
  // We return the response (for cookies), the client (if needed), and the user
  return { supabaseResponse, supabase, user };
}