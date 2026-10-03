"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore"; // Zustand 스토어로 교체
import { usePathname, useRouter } from "next/navigation";
import { clientFetch } from "@/lib/api";
import { toast } from "sonner"; // Sonner 토스트 추가

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter(); 
  
  // Zustand 스토어에서 상태와 액션을 안전하게 구조 분해 할당합니다.
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // 연타 방지
    setIsLoggingOut(true);

    // 로그아웃 중 다른 요청이 401을 받아도 "세션 만료" 모달이 뜨지 않도록 하는 플래그
    sessionStorage.setItem("is_intentional_logout", "true");

    try {
      const res = await clientFetch("/api/accounts/logout/", {
        method: "POST",
      });

      // 401은 이미 세션이 끝난 상태이므로 로그아웃 성공으로 간주
      if (!res.ok && res.status !== 401) {
        throw new Error(`로그아웃 실패: ${res.status}`);
      }

      // 서버 로그아웃이 확인된 경우에만 클라이언트 상태를 비우기
      clearAuth();
      toast.success("성공적으로 로그아웃 되었습니다.");
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout API Error:", err);
      // 로그인 상태는 그대로 유지 → 사용자가 다시 시도할 수 있음
      toast.error("로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      sessionStorage.removeItem("is_intentional_logout");
      setIsLoggingOut(false);
    }
  };

  // 공통 링크 스타일 정의 (활성화 시 하단 인디케이터 바 추가)
  const getLinkClass = (isActive: boolean) => {
    return isActive
      ? "text-teal-400 font-bold relative after:absolute after:bottom-[-20px] after:left-0 after:w-full after:h-[2px] after:bg-teal-400 transition-all"
      : "text-slate-400 hover:text-slate-200 transition-colors font-medium";
  };

  return (
    <nav className="fixed top-0 w-full bg-slate-900/95 backdrop-blur-md z-50 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="text-teal-400 font-black text-xl tracking-wider hover:opacity-90 transition-opacity">
          LUNA
        </Link>
        
        {/* 메뉴 링크 */}
        <div className="flex gap-8 items-center h-full">
          <Link 
            href="/humidity-map" 
            className={getLinkClass(pathname === "/humidity-map/")}
          >
            습도 맵
          </Link>
          <Link href="/album" className={getLinkClass(pathname === "/album/")}>
            앨범
          </Link>
          <Link 
            href="/board" 
            className={getLinkClass(pathname.startsWith("/board/"))}
          >
            게시판
          </Link>

          {/* 로그인 상태에 따른 동적 버튼 렌더링 */}
          {isLoggedIn ? (
            <div className="flex items-center gap-4 pl-2 border-l border-slate-800">
              <span className="text-xs font-medium text-slate-300 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700/50">
                ✨ <strong className="text-teal-400 font-bold">{user?.username}</strong> 님
              </span>
              <button 
                onClick={handleLogout} 
                disabled={isLoggingOut}
                className="text-slate-500 hover:text-rose-400 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
              </button>
            </div>
          ) : (
            <div className="pl-2 border-l border-slate-800">
              <Link 
                href="/login" 
                className={getLinkClass(pathname === "/login/")}
              >
                로그인
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}