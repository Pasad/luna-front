// app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex flex-col justify-center items-center px-6 text-center">
      <span className="text-5xl mb-6">🔍</span>
      <h2 className="text-2xl font-black text-[#2D2A28] mb-3">페이지를 찾을 수 없습니다</h2>
      <p className="text-sm text-[#8E8781] max-w-md leading-relaxed mb-8">
        주소가 잘못되었거나 삭제된 페이지일 수 있어요.
      </p>
      <div className="flex items-center gap-3">
        <Link
          href="/board"
          className="bg-[#2D2A28] text-white px-6 py-3 rounded-full text-sm font-bold shadow-md hover:bg-teal-600 transition-colors"
        >
          게시판으로
        </Link>
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