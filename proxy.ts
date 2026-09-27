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

function getClientIP(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");

  if (xff) {
    return xff.split(",")[0].trim();
  }

  return req.headers.get("x-real-ip") || null;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/not-authorized" || isPublicAssetPath(pathname)) {
    return NextResponse.next();
  }

  const allowedIP = "192.168.1.138";
  const clientIP = getClientIP(req);

  console.log("Allowed IP:", allowedIP);
  console.log("Client IP:", clientIP);

  if (!clientIP || clientIP !== allowedIP) {
    return NextResponse.redirect(
      new URL("/not-authorized", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|api/|not-authorized|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};