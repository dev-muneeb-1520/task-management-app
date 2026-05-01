import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES    = ["/login", "/register"];
const ADMIN_LOGIN_PATH = "/admin/login";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const userRole    = request.cookies.get("user_role")?.value;

  const isAdminLoginRoute = pathname === ADMIN_LOGIN_PATH;
  const isPublicRoute     = PUBLIC_ROUTES.includes(pathname);
  // Admin login is treated as its own public entry point — not a protected admin route
  const isAdminRoute      = pathname.startsWith("/admin") && !isAdminLoginRoute;
  const isProtected       = !isPublicRoute && !isAdminLoginRoute;

  // Redirect unauthenticated users trying to access protected routes
  if (!accessToken && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect non-admins away from protected admin routes
  if (isAdminRoute && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Handle /admin/login when already authenticated
  if (accessToken && isAdminLoginRoute) {
    // Already admin → go straight to admin panel
    if (userRole === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    // Regular user visiting admin login → send them to their dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect authenticated users away from regular auth pages
  if (accessToken && isPublicRoute) {
    // Admins always land on their dashboard
    if (userRole === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect admin away from the user-facing dashboard
  if (accessToken && userRole === "ADMIN" && pathname === "/dashboard") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (svg, png, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
