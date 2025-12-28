// root/middleware.ts
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // 1. Run the Supabase session update
  // We destructure the user and the response directly
  const { supabaseResponse, user } = await updateSession(request);

  // 2. Define protected routes
  const protectedRoutes = ["/dashboard", "/loans", "/borrowers", "/settings", "/settings/profile"];

  // 3. Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // 4. Handle Auth Logic
  if (isProtectedRoute && !user) {
    // If accessing a protected route without a user, redirect to login
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirectedFrom", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // OPTIONAL: Redirect logged-in users away from login page
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth/login");
  if (isAuthPage && user) {
     return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 5. Return the Supabase response (important for refreshing cookies)
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};