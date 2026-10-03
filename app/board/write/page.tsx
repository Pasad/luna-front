// app/board/write/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clientFetch } from "@/lib/api";
import { toast } from "sonner"; 
import { useModalStore } from "@/store/useModalStore"; // 전역 모달 스토어 임포트
import { getApiErrorMessage, getNetworkErrorMessage } from "@/lib/errors";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";

const TITLE_MAX = 200;          // Post.title max_length
const CONTENT_MAX = 10000;      // 모델에는 제한이 없어 임의로 정함. 백엔드 정책에 맞춰 조정하세요.
const FIELD_LABELS = { title: "제목", content: "내용" };

export default function BoardWritePage() {
  const router = useRouter();
  const openModal = useModalStore((state) => state.openModal); // 모달 열기 액션 구독
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 작성 중인 내용이 있으면 새로고침/탭 닫기 전에 확인
  useUnsavedChangesWarning(!isSubmitting && (title.trim() !== "" || content.trim() !== ""));

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await clientFetch("/api/accounts/user-info/"); 
        
        if (!res.ok) {
          toast.error("로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다!", {
            id: "login-required-toast"
          });
          router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        }
      } catch (err) {
        console.error("Login Check Error:", err);
      }
    };
    
    checkLogin();
  }, [router]);

  // [신규 추가] 취소 버튼 클릭 시 처리 로직
  const handleCancelRequest = () => {
    // 아무것도 적지 않았다면 모달 없이 즉시 게시판 목록으로 이동
    if (!title.trim() && !content.trim()) {
      router.push("/board");
      return;
    }

    // 한 글자라도 적혀있다면 전역 커스텀 모달 오픈
    openModal({
      title: "작성 취소 ✍️",
      message: "지금 이 페이지를 벗어나면 작성 중인 글이 저장되지 않고 완전히 사라집니다. 정말 취소하시겠습니까?",
      confirmText: "페이지 이탈",
      cancelText: "계속 작성",
      onConfirm: () => {
        router.push("/board"); // 확인 누르면 목록으로 리다이렉트
      },
    });
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim() || !content.trim()) {
      toast.warning("제목과 내용을 모두 입력해 주세요! ✍️");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await clientFetch("/api/board/posts/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });

      if (!res.ok) {
        // 401은 clientFetch가 세션 만료 모달을 띄웁니다. 여기서는 안내만 하고 작성 내용을 유지합니다.
        toast.error(await getApiErrorMessage(res, "게시글 등록에 실패했습니다.", FIELD_LABELS));
        return;
      }

      toast.success("새 글 등록에 성공했습니다.");
      router.push("/board");
      router.refresh();
    } catch (err) {
      console.error("Write Post Error:", err);
      toast.error(getNetworkErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] text-[#4A4543] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-black text-[#2D2A28] tracking-tight mb-2">새 이야기 작성하기</h1>
          <p className="text-sm text-[#8E8781]">오늘 제주의 기상이나 나누고 싶은 소소한 일상을 남겨주세요.</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.04)] border border-[#F0EDE5] p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-xs font-bold text-[#8E8781] uppercase tracking-wider mb-2 pl-1">제목</label>
              <input
                id="title"
                type="text"
                maxLength={TITLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력해 주세요"
                className="w-full bg-[#FAF9F6] border border-[#F0EDE5] rounded-2xl px-5 py-4 text-sm font-semibold text-[#2D2A28] focus:outline-none focus:border-teal-500 transition-colors placeholder-[#CCC5C0]"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-xs font-bold text-[#8E8781] uppercase tracking-wider mb-2 pl-1">내용</label>
              <textarea
                id="content"
                rows={10}
                maxLength={CONTENT_MAX}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="자유롭게 적어주세요..."
                className="w-full bg-[#FAF9F6] border border-[#F0EDE5] rounded-3xl px-5 py-4 text-sm font-medium text-[#4A4543] focus:outline-none focus:border-teal-500 transition-colors placeholder-[#CCC5C0] resize-none leading-relaxed"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0EDE5]">
              <button 
                type="button"
                onClick={handleCancelRequest}
                className="bg-[#FAF9F6] border border-[#F0EDE5] text-[#8E8781] px-6 py-3 rounded-full text-sm font-bold hover:bg-[#F0EDE5] transition-colors"
              >
                취소
              </button>
              <button type="submit" disabled={isSubmitting} className="bg-[#2D2A28] text-white px-8 py-3 rounded-full text-sm font-bold shadow-md hover:bg-teal-600 transition-colors disabled:bg-[#CCC5C0] min-w-[120px]">
                {isSubmitting ? "등록 중..." : "✍️ 등록하기"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}