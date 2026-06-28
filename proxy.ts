import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isPublicAssetPath(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.includes(".")
  );
}

async function getDomainIP(domain: string) {
  // using public DNS resolver API (Edge-safe)
  const res = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
  const data = await res.json();

  return data?.Answer?.[0]?.data; // first A record IP
}

function getClientIP(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();

  return req.headers.get("x-real-ip") || null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/not-authorized" || isPublicAssetPath(pathname)) {
    return NextResponse.next();
  }

  const allowedDomain = "nestnepal.reyeeddns.com";

  const [allowedIP, clientIP] = await Promise.all([
    getDomainIP(allowedDomain),
    Promise.resolve(getClientIP(req)),
  ]);

  console.log("Allowed IP:", allowedIP);
  console.log("Client IP:", clientIP);

  if (!allowedIP || !clientIP) {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }

  if (allowedIP !== clientIP) {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/|not-authorized|favicon.ico|robots.txt|sitemap.xml).*)"],
};