// root/proxy.ts
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  // 1. Run the Supabase session update
  const { supabaseResponse, user } = await updateSession(request);

  // 2. Define protected routes
  // Note: /funds is protected, but we handle the root logic separately below
  const protectedRoutes = [
    "/funds", 
    "/dashboard", 
    "/loans", 
    "/borrowers", 
    "/settings"
  ];

  const path = request.nextUrl.pathname;

  // 3. Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );

  // 4. Handle Auth Logic: Protect Routes
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirectedFrom", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Handle "Hub" Logic: Redirect Logged-In Users
  // If user is logged in and tries to visit Landing or Login, send them to Fund Selection
  if (user && (path === "/" || path.startsWith("/auth/login") || path === "/login")) {
    return NextResponse.redirect(new URL("/funds", request.url));
  }

  // 6. Return the Supabase response (Crucial for refreshing cookies)
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