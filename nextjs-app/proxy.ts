import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  console.log("🔍 [MW] AUTH_SECRET present?", !!secret);
  const allCookies = request.cookies.getAll();
  console.log("🔍 [MW] All cookies:", allCookies.map(c => c.name).join(", "));
  
  const token = await getToken({ req: request, secret });
  const userRole = typeof token?.role === "string" ? token.role : undefined;
  const path = request.nextUrl.pathname;

  console.log("🔍 [MW] Path:", path, "| Token found:", !!token, "| Role:", userRole);
  if (token) {
    console.log("🔍 [MW] Token:", { id: token.id, role: token.role, email: token.email });
  }

  // Protected routes
  const protectedRoutes = ["/buyer", "/seller", "/admin", "/messages"];
  const isProtected = protectedRoutes.some((route) => path.startsWith(route));

  if (isProtected && !token) {
    console.log("❌ [MW] No token for protected route →redirecting to /login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based access
  if (path.startsWith("/buyer") && userRole !== "buyer") {
    console.log("❌ [MW] Role mismatch: is", userRole, "not buyer → /");
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (path.startsWith("/seller") && userRole !== "seller") {
    console.log("❌ [MW] Role mismatch: is", userRole, "not seller → /");
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (path.startsWith("/admin") && userRole !== "admin") {
    console.log("❌ [MW] Role mismatch: is", userRole, "not admin → /");
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (path.startsWith("/messages") && !token) {
    console.log("❌ [MW] No token for /messages → /login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  console.log("✅ [MW] Access allowed:", path);
  return NextResponse.next();
}

export const config = {
  matcher: ["/buyer/:path*", "/seller/:path*", "/admin/:path*", "/messages/:path*"],
};
