// components/common/ErrorView.tsx
"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ErrorViewProps {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  description: string;
}

export default function ErrorView({ error, reset, title, description }: ErrorViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // 프로덕션에서는 message가 가려지므로 digest로 서버 로그와 대조합니다.
    console.error("페이지 에러:", error.digest ?? "", error);
  }, [error]);

  const handleRetry = () => {
    // 서버 컴포넌트 데이터를 다시 가져온 뒤 에러 경계를 초기화합니다.
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex flex-col justify-center items-center px-6 text-center">
      <span className="text-5xl mb-6">⏳</span>
      <h2 className="text-2xl font-black text-[#2D2A28] mb-3">{title}</h2>
      <p className="text-sm text-[#8E8781] max-w-md leading-relaxed mb-8">{description}</p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleRetry}
          disabled={isPending}
          className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg transition-all disabled:opacity-60"
        >
          {isPending ? "불러오는 중..." : "🔄 다시 시도하기"}
        </button>
        <Link
          href="/"
          className="bg-white border border-[#F0EDE5] text-[#8E8781] px-6 py-3 rounded-full text-sm font-bold hover:bg-[#F0EDE5] transition-colors"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}