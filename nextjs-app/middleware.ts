import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const path = request.nextUrl.pathname;

  // Protected routes
  const protectedRoutes = ["/buyer", "/seller", "/admin", "/messages"];
  const isProtected = protectedRoutes.some((route) => path.startsWith(route));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based access
  if (path.startsWith("/buyer") && session?.user?.role !== "buyer") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (path.startsWith("/seller") && session?.user?.role !== "seller") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (path.startsWith("/admin") && session?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (path.startsWith("/messages") && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/buyer/:path*", "/seller/:path*", "/admin/:path*", "/messages/:path*"],
};
