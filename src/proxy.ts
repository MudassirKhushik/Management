import { auth } from "../auth";
import { NextResponse } from "next/server";

// simple in-memory cache (Note: Edge infrastructure may clear this frequently, which is fine)
const domainCache = new Map<string, { slug: string | null; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

async function resolveSlugForDomain(host: string, requestUrl: string): Promise<string | null> {
  const cached = domainCache.get(host);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.slug;
  }
  try {
    // Dynamic origin nikalen taaki internal fetch fail na ho
    const urlObj = new URL(requestUrl);
    const origin = urlObj.origin; 

    const res = await fetch(
      `${origin}/api/agencies/resolve-domain?host=${encodeURIComponent(host)}`
    );
    const data = await res.json();
    const slug = data.slug ?? null;
    domainCache.set(host, { slug, ts: Date.now() });
    return slug;
  } catch (err) {
    console.error("Cache resolution failed:", err);
    return null; // fail open, don't break the site if lookup fails
  }
}

export default auth(async (req) => {
  const host = req.headers.get("host") || "";
  const pathname = req.nextUrl.pathname;

  // Aapka main production domain bhi yahan include hona chahiye
  const isKnownVercelHost =
    host.endsWith(".vercel.app") || 
    host.startsWith("localhost") || 
    host.includes("travelcraft.com"); // Apne main domain ka naam likhein

  const isLoginPage = pathname === "/portal/login";
  const isOnPortal = pathname.startsWith("/portal") && !isLoginPage;
  const isOnAdmin = pathname.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api");

  const isSharedRoute = isOnPortal || isLoginPage || isOnAdmin || isApiRoute;

  // ---- 1) Custom domain -> agency rewrite (runs first) ----
  if (!isKnownVercelHost && !isSharedRoute) {
    // req.url pass kar rahe hain dynamic url parsing ke liye
    const agencySlug = await resolveSlugForDomain(host, req.url);
    if (agencySlug) {
      const url = req.nextUrl.clone();
      url.pathname = `/${agencySlug}${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // ---- 2) existing auth logic, unchanged ----
  const isLoggedIn = !!req.auth;
  // @ts-ignore (if types are strict)
  const isSuperAdmin = req.auth?.user?.isSuperAdmin;

  if ((isOnPortal || isOnAdmin) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/portal/login", req.nextUrl));
  }

  if (isOnAdmin && isLoggedIn && !isSuperAdmin) {
    return NextResponse.redirect(new URL("/portal", req.nextUrl));
  }

  if (isOnPortal && isLoggedIn && isSuperAdmin) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
