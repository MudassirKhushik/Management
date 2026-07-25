import { auth } from "../auth";
import { NextResponse } from "next/server";
 
// Middleware runs BEFORE any page loads. Here, we check: is someone
// trying to visit a /portal page without being logged in? If so,
// bounce them to the login page instead of letting the page load.
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnPortal = req.nextUrl.pathname.startsWith("/portal");
  const isLoginPage = req.nextUrl.pathname === "/portal/login";
 
  if (isOnPortal && !isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/portal/login", req.nextUrl));
  }
});
 
// This tells Next.js WHICH routes this middleware should even run on —
// no point checking auth on the public homepage or API routes for images etc.
export const config = {
  matcher: ["/portal/:path*"],
};
 