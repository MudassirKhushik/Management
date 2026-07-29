import { auth } from "../auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isSuperAdmin = req.auth?.user?.isSuperAdmin;
  const path = req.nextUrl.pathname;

  const isLoginPage = path === "/portal/login";
  const isOnPortal = path.startsWith("/portal") && !isLoginPage;
  const isOnAdmin = path.startsWith("/admin");

  // Not logged in at all - block both areas, send to login
  if ((isOnPortal || isOnAdmin) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/portal/login", req.nextUrl));
  }

  // Logged in, but an agency user trying to reach the admin area
  if (isOnAdmin && isLoggedIn && !isSuperAdmin) {
    return NextResponse.redirect(new URL("/portal", req.nextUrl));
  }

  // Logged in, but the super admin trying to reach the agency portal
  if (isOnPortal && isLoggedIn && isSuperAdmin) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }
});

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};