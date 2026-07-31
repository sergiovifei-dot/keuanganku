import { NextRequest, NextResponse } from "next/server";

const SECRET_COOKIE = "kku_s";

// Rate limiter sederhana in-memory (per instance). 100 req / menit / IP.
const WINDOW = 60_000;
const LIMIT = 100;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) { hits.set(ip, { count: 1, reset: now + WINDOW }); return false; }
  rec.count += 1;
  if (hits.size > 5000) for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
  return rec.count > LIMIT;
}

function constEq(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export function middleware(req: NextRequest) {
  const secret = process.env.APP_SECRET_SLUG || "";
  const { pathname } = req.nextUrl;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";

  if (rateLimited(ip)) return new NextResponse("Too Many Requests", { status: 429 });

  // Biarkan API lewat; setiap route handler memvalidasi secret sendiri (cookie/query).
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const cookieSecret = req.cookies.get(SECRET_COOKIE)?.value || "";

  // Root: arahkan ke URL rahasia bila cookie valid, jika tidak -> 404.
  if (pathname === "/") {
    if (constEq(cookieSecret, secret)) {
      return NextResponse.redirect(new URL(`/${secret}`, req.url));
    }
    return new NextResponse(null, { status: 404 });
  }

  // Semua path /[secret]/... : segmen pertama harus cocok, kalau tidak 404.
  const seg = pathname.split("/")[1] || "";
  if (!constEq(seg, secret)) {
    return new NextResponse(null, { status: 404 });
  }

  // Cocok -> set cookie httpOnly agar kunjungan berikutnya tak perlu ketik URL.
  const res = NextResponse.next();
  if (!constEq(cookieSecret, secret)) {
    res.cookies.set(SECRET_COOKIE, secret, {
      httpOnly: true, sameSite: "lax", path: "/",
      secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365,
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|icons|manifest.webmanifest|sw.js|robots.txt).*)"],
};
