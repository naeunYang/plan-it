import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PAGES = [
  "/dashboard",
  "/todos",
  "/schedules",
  "/issues",
  "/memos",
  "/history",
];
const AUTH_PAGES = ["/login", "/register"];
const PROTECTED_API = [
  "/api/todos",
  "/api/schedules",
  "/api/issues",
  "/api/memos",
  "/api/history",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionId = request.cookies.get("session_id")?.value;

  // 보호 페이지 → 세션 없으면 /login 리다이렉트
  if (PROTECTED_PAGES.some((p) => pathname.startsWith(p))) {
    if (!sessionId) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 인증 페이지 → 세션 있으면 /dashboard 리다이렉트
  if (AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    if (sessionId) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 보호 API → 세션 없으면 401
  if (PROTECTED_API.some((p) => pathname.startsWith(p))) {
    if (!sessionId) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/todos/:path*",
    "/schedules/:path*",
    "/issues/:path*",
    "/memos/:path*",
    "/history/:path*",
    "/login",
    "/register",
    "/api/todos/:path*",
    "/api/schedules/:path*",
    "/api/issues/:path*",
    "/api/memos/:path*",
    "/api/history/:path*",
  ],
};
