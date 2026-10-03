"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { clientFetch } from "@/lib/api";
import { toast } from "sonner";
import { getSafeRedirectPath } from "@/lib/validators";

function LoginPageComponent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // 쿼리 스트링 읽기용 훅
  
  // 로그인 후 이동할 경로를 안전하게 검증합니다. ("/board" 등 내부 경로만 허용)
  const nextRoute = getSafeRedirectPath(searchParams.get("next"));

  const checkLoginStatus = useAuthStore((state) => state.checkLoginStatus); 

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    
    try {
      const res = await clientFetch("/api/accounts/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");

      await checkLoginStatus(); 

      toast.success("성공적으로 로그인되었습니다.");
      
      // 홈('/')이 아닌, 원래 가려던 목적지(nextRoute)로 이동시킵니다.
      router.push(nextRoute);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] text-[#4A4543] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.04)] border border-[#F0EDE5] p-8 sm:p-10">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-[#2D2A28] mb-2">루나 커뮤니티 로그인</h1>
          <p className="text-xs text-[#8E8781]">게시글 작성을 위해 로그인이 필요합니다.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-[#8E8781] uppercase tracking-wider mb-2 pl-1">아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="장고 어드민 아이디를 입력하세요"
              className="w-full bg-[#FAF9F6] border border-[#F0EDE5] rounded-2xl px-5 py-4 text-sm font-semibold text-[#2D2A28] focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8E8781] uppercase tracking-wider mb-2 pl-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full bg-[#FAF9F6] border border-[#F0EDE5] rounded-2xl px-5 py-4 text-sm font-semibold text-[#2D2A28] focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2D2A28] text-white py-4 rounded-full text-sm font-bold shadow-md hover:bg-teal-600 transition-colors disabled:bg-[#CCC5C0] mt-4"
          >
            {isLoading ? "로그인 중..." : "🔑 로그인하기"}
          </button>
        </form>

      </div>
    </div>
  );
}

// 최종 export 단에서 Suspense 디자인 경계를 씌워 빌드 에러 우회 처리
export default function LoginPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex items-center justify-center text-sm text-[#8E8781]">
          로그인 화면을 불러오는 중...
        </div>
      }
    >
      <LoginPageComponent />
    </Suspense>
  );
}