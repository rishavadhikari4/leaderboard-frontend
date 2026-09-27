import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getClientIP(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");

  if (xff) {
    return xff.split(",")[0].trim();
  }

  return req.headers.get("x-real-ip") || null;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/not-authorized") {
    return NextResponse.next();
  }

  const allowedIPv6 =
    "2400:1a00:4b29:5cf5::10";

  const clientIP = getClientIP(req);

  console.log("Client IP:", clientIP);
  console.log("Allowed IPv6:", allowedIPv6);

  if (!clientIP || clientIP !== allowedIPv6) {
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