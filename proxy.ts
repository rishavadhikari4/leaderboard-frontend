import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_IP = process.env.ALLOWED_IP?.trim().toLowerCase();

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
  if (!ALLOWED_IP) {
    return false;
  }

  return (
    normalizedIP === ALLOWED_IP ||
    normalizedIP === `::ffff:${ALLOWED_IP}`
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