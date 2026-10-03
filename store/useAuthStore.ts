// store/useAuthStore.ts
import { create } from "zustand";
import { clientFetch } from "@/lib/api";

// 유저 정보 데이터 타입 정의
interface UserProfile {
  id?: number;
  username: string;
  email?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  user: UserProfile | null;
  setIsLoggedIn: (status: boolean) => void;
  setUser: (user: UserProfile | null) => void;
  checkLoginStatus: () => Promise<boolean>; // 상태 판단을 위해 반환 타입을 boolean으로 확장
  clearAuth: () => void; 
}

export const useAuthStore = create<AuthState>((set) => ({
  // 1. 초기 상태 세팅
  isLoggedIn: false,
  user: null,

  // 2. 상태 변경 액션들
  setIsLoggedIn: (status) => set({ isLoggedIn: status }),
  setUser: (user) => set({ user }),
  clearAuth: () => set({ isLoggedIn: false, user: null }),

  // 3. 로그인 상태 체크 비동기 함수 (개선 버전)
  checkLoginStatus: async () => {
    try {
      const res = await clientFetch("/api/accounts/user-info/", {
        method: "GET",
        credentials: "include", 
      });
      
      if (res.ok) {
        const data = await res.json();
        set({ 
          isLoggedIn: true, 
          user: { id: data.id, username: data.username, email: data.email }
        });
        return true; // 인증 성공
      } else {
        set({ isLoggedIn: false, user: null });
        return false; // 인증 실패 (401 등)
      }
    } catch {
      set({ isLoggedIn: false, user: null });
      return false; // 에러 발생
    }
  },
}));