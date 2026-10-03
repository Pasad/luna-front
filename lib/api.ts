// lib/api.ts

const CLIENT_TIMEOUT_MS = 15_000;
const UPLOAD_TIMEOUT_MS = 60_000;
const SERVER_TIMEOUT_MS = 20_000; // 무료 백엔드 콜드스타트 대응
const SERVER_RETRIES = 1;         // 서버 GET 재시도 횟수
const RETRY_DELAY_MS = 1_000;
const RETRY_STATUSES = new Set([502, 503, 504]);

// 이 경로의 401은 "세션 만료"가 아니므로 갱신을 시도하지 않습니다.
const AUTH_SKIP_PATHS = [
  "/api/accounts/login/",
  "/api/accounts/logout/",
  "/api/accounts/token/refresh/",
];

// ───────────────────────── 공통 유틸 ─────────────────────────

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 호출자가 넘긴 signal과 타임아웃 signal을 합칩니다.
function withTimeout(signal: AbortSignal | null | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

function isAuthPath(url: string): boolean {
  return AUTH_SKIP_PATHS.some((path) => url.startsWith(path));
}

// ───────────────────────── 서버 컴포넌트용 ─────────────────────────

// 502/503/504나 네트워크 오류일 때 GET 요청만 재시도합니다.
async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const maxAttempts = method === "GET" ? SERVER_RETRIES + 1 : 1;

  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: withTimeout(init.signal, SERVER_TIMEOUT_MS),
      });

      if (RETRY_STATUSES.has(res.status) && attempt < maxAttempts) {
        console.warn(`[backendFetch] ${res.status} 재시도 (${attempt}/${maxAttempts - 1})`, url);
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      return res;
    } catch (err) {
      if (attempt >= maxAttempts) throw err;
      console.warn(`[backendFetch] 네트워크 오류 재시도 (${attempt}/${maxAttempts - 1})`, url);
      await sleep(RETRY_DELAY_MS);
    }
  }
}

function getBackendUrl(): string {
  const backendUrl = process.env.DJANGO_BACKEND_URL;
  if (!backendUrl) {
    // 설정 누락 시 "undefined/api/..." 로 요청이 나가는 것을 막습니다.
    throw new Error("DJANGO_BACKEND_URL 환경변수가 설정되지 않았습니다.");
  }
  return backendUrl;
}

function buildHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

// [서버 컴포넌트 전용] 브라우저가 보낸 쿠키를 백엔드로 전달합니다.
export async function serverFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // 클라이언트 번들과의 충돌을 피하기 위해 실행 시점에 동적 임포트
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  const headers = buildHeaders(options);
  headers.set(
    "Cookie",
    cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ")
  );

  return fetchWithRetry(`${getBackendUrl()}${url}`, { ...options, headers });
}

// [서버 컴포넌트 전용] 인증이 필요 없는 공개 API용. 사용자 쿠키를 보내지 않습니다.
export async function publicFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetchWithRetry(`${getBackendUrl()}${url}`, {
    ...options,
    headers: buildHeaders(options),
  });
}

// ───────────────────────── 클라이언트 컴포넌트용 ─────────────────────────

// 세션 만료 모달이 떠 있는 동안 중복 트리거를 막는 플래그
let isSessionExpiredAlertShown = false;

// 동시에 여러 요청이 401을 받아도 갱신은 한 번만 하고, 모두 같은 결과를 공유합니다.
let refreshPromise: Promise<boolean> | null = null;

function refreshToken(): Promise<boolean> {
  if (!refreshPromise) {
    const proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL || "";
    refreshPromise = fetch(`${proxyUrl}/api/accounts/token/refresh/`, {
      method: "POST",
      credentials: "include",
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function isIntentionalLogout(): boolean {
  try {
    return sessionStorage.getItem("is_intentional_logout") === "true";
  } catch {
    return false;
  }
}

// 갱신에 실패했을 때: 로그인 상태였던 사용자에게만 만료 모달을 보여줍니다.
async function handleRefreshFailure(): Promise<void> {
  if (typeof window === "undefined") return;
  if (isIntentionalLogout()) return; // 사용자가 직접 로그아웃한 경우

  const [{ useAuthStore }, { useModalStore }] = await Promise.all([
    import("@/store/useAuthStore"),
    import("@/store/useModalStore"),
  ]);

  // 원래 로그인하지 않은 사용자의 401은 정상 상황입니다.
  if (!useAuthStore.getState().isLoggedIn) return;
  if (isSessionExpiredAlertShown) return;
  isSessionExpiredAlertShown = true;

  // 모달 확인 전이라도 클라이언트의 인증 상태는 먼저 비웁니다.
  useAuthStore.getState().clearAuth();

  const loginUrl = `/login?next=${encodeURIComponent(
    window.location.pathname + window.location.search
  )}`;

  useModalStore.getState().openModal({
    title: "로그인 세션 만료",
    message:
      "보안을 위해 로그인 세션이 안전하게 만료되었습니다.\n다시 로그인하여 서비스를 계속 이용해 주세요.",
    confirmText: "로그인하러 가기",
    cancelText: "닫기",
    onConfirm: () => {
      isSessionExpiredAlertShown = false;
      window.location.assign(loginUrl);
    },
    onCancel: () => {
      isSessionExpiredAlertShown = false;
    },
  });
}

// allowRefresh=false 이면 401을 받아도 갱신/재시도를 하지 않습니다. (재시도는 1회만)
async function request(
  url: string,
  options: RequestInit,
  allowRefresh: boolean
): Promise<Response> {
  const proxyUrl = process.env.NEXT_PUBLIC_PROXY_URL || "";
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${proxyUrl}${url}`, {
    ...options,
    credentials: "include",
    headers: buildHeaders(options),
    signal: withTimeout(options.signal, isFormData ? UPLOAD_TIMEOUT_MS : CLIENT_TIMEOUT_MS),
  });

  if (response.status !== 401 || !allowRefresh || isAuthPath(url)) return response;

  // 만료 모달이 떠 있는 동안에는 추가 갱신을 시도하지 않습니다.
  if (isSessionExpiredAlertShown) return response;

  const refreshed = await refreshToken();
  if (refreshed) return request(url, options, false); // 딱 한 번만 재시도

  await handleRefreshFailure();
  return response;
}

// [클라이언트 컴포넌트 전용] Vercel 프록시(/api)를 통한 fetch 래퍼
export function clientFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return request(url, options, true);
}