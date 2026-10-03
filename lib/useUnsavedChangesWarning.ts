// lib/useUnsavedChangesWarning.ts
import { useEffect } from "react";

/** 저장하지 않은 변경이 있을 때 새로고침/탭 닫기를 브라우저가 확인하게 합니다. */
export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // 일부 브라우저에서 필요
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);
}