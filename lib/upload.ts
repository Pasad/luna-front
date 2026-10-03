// lib/upload.ts

// 호스팅 환경의 요청 본문 한도(Vercel은 약 4.5MB로 알려져 있음)보다 작게 둡니다.
// 배포 환경에서 이 크기의 파일로 실제 업로드를 테스트해 보세요.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** 문제가 있으면 사용자용 메시지, 없으면 null */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "JPG, PNG, WEBP, GIF 형식의 이미지만 업로드할 수 있습니다.";
  }
  if (file.size === 0) return "비어 있는 파일입니다.";
  if (file.size > MAX_IMAGE_BYTES) {
    const limitMb = MAX_IMAGE_BYTES / 1024 / 1024;
    const currentMb = (file.size / 1024 / 1024).toFixed(1);
    return `이미지 용량은 ${limitMb}MB 이하여야 합니다. (현재 ${currentMb}MB)`;
  }
  return null;
}