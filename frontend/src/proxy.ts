import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const token = request.cookies.get("planner_token")?.value;
  const isLoginPage = request.nextUrl.pathname === "/auth/login";

  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};