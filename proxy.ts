import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_IP = "27.34.64.15,10.0.1.71,2400:1a00:4b29:5cf5::10,fe80::e6ad:c565:aed9:bc6,10.0.1.71";

const ALLOWED_IPS = new Set(
  (ALLOWED_IP ?? "")
    .split(",")
    .map((ip) => ip.trim().toLowerCase())
    .filter(Boolean),
);

function getClientIP(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");

  if (xff) {
    return xff.split(",")[0].trim();
  }

  return req.headers.get("x-real-ip") || null;
}

function isAllowedWifiIP(ip: string | null): boolean {
  if (!ip) {
    return false;
  }

  const normalizedIP = ip.replace(/^[[]|[]]$/g, "").toLowerCase();
  if (ALLOWED_IPS.size === 0) {
    return false;
  }

  return (
    ALLOWED_IPS.has(normalizedIP) ||
    ALLOWED_IPS.has(normalizedIP.replace(/^::ffff:/, ""))
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/not-authorized") {
    return NextResponse.next();
  }

  const clientIP = getClientIP(req);

  if (!isAllowedWifiIP(clientIP)) {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|not-authorized|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
