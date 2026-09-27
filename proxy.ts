import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getClientIP(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");

  if (xff) {
    return xff.split(",")[0].trim();
  }

  return req.headers.get("x-real-ip") || null;
}

function isPrivateNetworkIP(ip: string | null): boolean {
  if (!ip) {
    return false;
  }

  const normalizedIP = ip.replace(/^[[]|[]]$/g, "").toLowerCase();

  if (normalizedIP === "::1" || normalizedIP === "localhost") {
    return true;
  }

  const ipv4 = normalizedIP.startsWith("::ffff:")
    ? normalizedIP.slice(7)
    : normalizedIP;
  const octets = ipv4.split(".").map(Number);

  if (
    octets.length === 4 &&
    octets.every((octet) => Number.isInteger(octet) && octet >= 0 && octet <= 255)
  ) {
    const [first, second] = octets;

    return (
      first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 169 && second === 254) ||
      first === 127
    );
  }

  return normalizedIP.startsWith("fc") || normalizedIP.startsWith("fd") || normalizedIP.startsWith("fe80:");
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/not-authorized") {
    return NextResponse.next();
  }

  const clientIP = getClientIP(req);

  if (!isPrivateNetworkIP(clientIP)) {
    return NextResponse.redirect(new URL("/not-authorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/|not-authorized|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};