// lib/errors.ts

const STATUS_MESSAGES: Record<number, string> = {
  401: "로그인이 필요하거나 세션이 만료되었습니다.",
  403: "이 작업을 수행할 권한이 없습니다.",
  404: "대상을 찾을 수 없습니다. 이미 삭제되었을 수 있어요.",
  413: "파일 용량이 너무 큽니다.",
  429: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
};

function extractMessage(data: unknown, labels: Record<string, string>): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;

  if (typeof record.detail === "string") return record.detail;

  // DRF 검증 오류: { "title": ["이 필드는 ..."], "image": ["..."] }
  for (const [field, value] of Object.entries(record)) {
    const first = Array.isArray(value)
      ? value.find((v): v is string => typeof v === "string")
      : typeof value === "string"
        ? value
        : undefined;
    if (first) {
      const label = labels[field];
      return label ? `${label}: ${first}` : first;
    }
  }
  return null;
}

/** 응답 상태코드와 본문(DRF 필드 오류)을 사용자용 메시지로 바꿉니다. */
export async function getApiErrorMessage(
  res: Response,
  fallback: string,
  fieldLabels: Record<string, string> = {}
): Promise<string> {
  if (STATUS_MESSAGES[res.status]) return STATUS_MESSAGES[res.status];
  if (res.status >= 500) return "서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.";

  if (res.status === 400) {
    try {
      const message = extractMessage(await res.clone().json(), fieldLabels);
      if (message) return message;
    } catch {
      // JSON이 아닌 응답이면 fallback 사용
    }
  }
  return fallback;
}

/** fetch 자체가 실패한 경우(타임아웃, 네트워크 끊김) 메시지 */
export function getNetworkErrorMessage(err: unknown): string {
  if (err instanceof DOMException && err.name === "TimeoutError") {
    return "요청 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해 주세요.";
  }
  return "서버와 통신하지 못했습니다. 네트워크 상태를 확인해 주세요.";
}