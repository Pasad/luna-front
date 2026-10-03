// components/common/AuthInitializer.tsx
"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";

export default function AuthInitializer() {
  const checkLoginStatus = useAuthStore((state) => state.checkLoginStatus);

  useEffect(() => {
    // 앱이 브라우저에 마운트되는 최초 시점에 장고 백엔드로 유저 정보(세션) 검증 요청을 보냅니다.
    checkLoginStatus();
  }, [checkLoginStatus]);

  // UI를 직접 그리지 않는 인프라성 컴포넌트이므로 null을 리턴합니다.
  return null;
}