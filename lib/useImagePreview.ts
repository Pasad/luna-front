// lib/useImagePreview.ts
import { useEffect, useRef, useState } from "react";

/** 선택한 파일의 미리보기 URL을 관리하고, 교체/언마운트 시 자동으로 해제합니다. */
export function useImagePreview(initialUrl: string | null = null) {
  const [file, setFileState] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const setFile = (next: File | null) => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setFileState(next);
    if (next) {
      const url = URL.createObjectURL(next);
      objectUrlRef.current = url;
      setPreviewUrl(url);
    } else {
      setPreviewUrl(initialUrl); // 선택 취소 시 원래 이미지(수정 화면) 또는 비움(등록 화면)
    }
  };

  return { file, previewUrl, setFile };
}