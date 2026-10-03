// components/common/SafeImage.tsx
"use client";

import { useState, type ImgHTMLAttributes } from "react";

// React 19 타입에서 <img>의 src는 string | Blob 이므로, 여기서는 문자열 URL만 받도록 좁힙니다.
type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src?: string | null;
};

/** 이미지 로드에 실패하면 깨진 아이콘 대신 대체 화면을 보여줍니다. */
export default function SafeImage({ src, alt, className, ...rest }: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !src || failedSrc === src; // src가 바뀌면 자동으로 다시 시도

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt || "이미지를 불러올 수 없습니다"}
        className={`flex items-center justify-center bg-gray-100 text-xs text-gray-400 ${className ?? ""}`}
      >
        이미지를 불러올 수 없습니다
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...rest} src={src} alt={alt} className={className} onError={() => setFailedSrc(src)} />
  );
}