import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  const userRole = typeof token?.role === "string" ? token.role : undefined;
  const path = request.nextUrl.pathname;

  // Protected routes
  const protectedRoutes = ["/buyer", "/seller", "/admin", "/messages"];
  const isProtected = protectedRoutes.some((route) => path.startsWith(route));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based access
  if (path.startsWith("/buyer") && userRole !== "buyer") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (path.startsWith("/seller") && userRole !== "seller") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (path.startsWith("/admin") && userRole !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (path.startsWith("/messages") && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/buyer/:path*", "/seller/:path*", "/admin/:path*", "/messages/:path*"],
};
