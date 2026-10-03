// next.config.ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// CSP_ENFORCE=true 일 때만 실제로 차단합니다. (기본값은 보고만 하는 Report-Only)
const cspHeaderName =
  process.env.CSP_ENFORCE === "true"
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only";

const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-inline': Next.js가 hydration용 인라인 스크립트를 삽입합니다. (아래 '알아둘 점' 참고)
  // 'unsafe-eval'은 개발 모드(React 디버깅)에서만 허용합니다.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://dapi.kakao.com https://*.daumcdn.net`,
  "style-src 'self' 'unsafe-inline'",
  // blob: 은 앨범 업로드 미리보기(URL.createObjectURL)용
  "img-src 'self' data: blob: https://*.daumcdn.net https://*.kakao.com",
  "font-src 'self' data:",
  `connect-src 'self' https://dapi.kakao.com https://*.kakao.com https://*.daumcdn.net${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
];

const securityHeaders = [
  { key: cspHeaderName, value: cspDirectives.join("; ") },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // 카카오 앱키의 도메인 검증은 Origin/Referer를 쓰므로 no-referrer 는 사용하지 않습니다.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
];

const nextConfig: NextConfig = {
  reactCompiler: true, // React 18의 새로운 컴파일러를 사용하도록 설정

  // 응답 헤더에서 "X-Powered-By: Next.js" 제거
  poweredByHeader: false,

  // Next.js가 주소 끝에 슬래시(/)를 강제로 유지
  // 장고 백엔드와 Next.js App Router를 연동하기 위한 설정
  trailingSlash: true,

  // 개발 모드 배지를 끄는 옵션
  devIndicators: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Vercel 내장 Reverse Proxy(우회) 설정
  async rewrites() {
    return [
      {
        // 끝에 슬래시가 붙는 요청 대응 (e.g. /api/board/posts/)
        source: "/api/:path*/",
        destination: `${process.env.DJANGO_BACKEND_URL}/api/:path*/`,
      },
      {
        // 끝에 슬래시가 없는 요청 대응 (e.g. /api/board/posts)
        source: "/api/:path*",
        destination: `${process.env.DJANGO_BACKEND_URL}/api/:path*`,
      },
      {
        // 미디어 파일 리라이트 규칙
        source: "/media/:path*",
        destination: `${process.env.DJANGO_BACKEND_URL}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;