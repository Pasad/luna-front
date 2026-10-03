// lib/validators.ts

/**
 * 로그인 후 이동할 경로를 검증합니다.
 * 같은 사이트 내부 경로("/board" 등)만 허용하고,
 * 외부 URL("https://evil.com", "//evil.com")은 fallback으로 대체합니다.
 */
export function getSafeRedirectPath(
  raw: string | null | undefined,
  fallback = "/"
): string {
  if (!raw) return fallback;

  // 반드시 "/"로 시작해야 함 (절대 URL, "javascript:" 등 차단)
  if (!raw.startsWith("/")) return fallback;

  // "//evil.com" 은 프로토콜 상대 URL이라 외부로 이동됨
  if (raw.startsWith("//")) return fallback;

  // 백슬래시, 탭/개행 등 제어문자는 브라우저가 "/"로 해석하거나 제거해서
  // "/\evil.com", "/\t/evil.com" 같은 우회에 쓰일 수 있음
  if (raw.includes("\\") || /[\u0000-\u001f]/.test(raw)) return fallback;

  return raw;
}

/** 1 이상의 정수만 허용합니다. 그 외(NaN, 음수, "1&x=y" 등)는 fallback. */
export function parsePositiveInt(
  value: string | null | undefined,
  fallback = 1
): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const n = Number(value);
  return Number.isSafeInteger(n) && n >= 1 ? n : fallback;
}

/** 경로 파라미터(id)가 숫자로만 이루어졌는지 확인합니다. */
export function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}