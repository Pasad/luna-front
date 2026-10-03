// proxy.ts
import { NextResponse, type NextRequest } from "next/server";

// 두 쿠키 모두 Path=/ 라서 모든 요청에서 확인할 수 있습니다.
// - accessToken: 수명 30분 (만료되면 브라우저가 삭제)
// - refreshToken: 수명 7일
const AUTH_COOKIE_NAMES = ["accessToken", "refreshToken"];

export function proxy(request: NextRequest) {
  const hasSession = AUTH_COOKIE_NAMES.some((name) => request.cookies.has(name));

  // accessToken이 만료돼 삭제됐어도 refreshToken이 있으면 통과시킵니다.
  // 이후 clientFetch가 401을 받고 자동으로 토큰을 갱신합니다.
  if (hasSession) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const loginUrl = new URL("/login/", request.url);
  loginUrl.searchParams.set("next", pathname + search); // 인코딩 자동 처리

  return NextResponse.redirect(loginUrl);
}

export const config = {
  // trailingSlash: true 설정이라 슬래시 유무를 모두 지정합니다.
  matcher: ["/board/write", "/board/write/:path*"],
};