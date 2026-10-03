"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { clientFetch } from "@/lib/api";
import { getApiErrorMessage, getNetworkErrorMessage } from "@/lib/errors";
import { isResourceOwner } from "@/lib/ownership";
import { isNumericId } from "@/lib/validators";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";
import { useModalStore } from "@/store/useModalStore";

const TITLE_MAX = 200; // Post.title max_length
const CONTENT_MAX = 10000; // 모델에는 제한이 없어 임의로 정한 값. 백엔드 정책에 맞춰 조정하세요.
const FIELD_LABELS = { title: "제목", content: "내용" };

export default function BoardEditPage() {
  const router = useRouter();
  const params = useParams();
  // string | string[] 중 문자열일 때만 사용
  const postId = typeof params.id === "string" ? params.id : undefined;

  const openModal = useModalStore((state) => state.openModal);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [initial, setInitial] = useState({ title: "", content: "" }); // 변경 여부 비교용 원본
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0); // "다시 시도" 시 effect를 다시 실행시키는 용도

  // 로딩 중, 오류 중, 전송 중에는 "변경됨"으로 보지 않습니다.
  const isDirty =
    !isLoadingData &&
    !loadError &&
    !isSubmitting &&
    (title !== initial.title || content !== initial.content);

  // 변경 사항이 있을 때 새로고침/탭 닫기 전에 브라우저가 확인하게 합니다.
  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    const initializePage = async () => {
      try {
        if (!postId || !isNumericId(postId)) {
          router.replace("/board");
          return;
        }

        const loginUrl = `/login?next=${encodeURIComponent(window.location.pathname)}`;

        // 1) 로그인 확인
        const authRes = await clientFetch("/api/accounts/user-info/");
        if (!authRes.ok) {
          toast.error("로그인이 필요한 서비스입니다.", { id: "login-required-toast" });
          router.replace(loginUrl);
          return;
        }
        const me = await authRes.json(); // { id, username, email, detail }

        // 2) 게시글 조회
        const postRes = await clientFetch(`/api/board/posts/${postId}/`);
        if (postRes.status === 404) {
          toast.error("존재하지 않거나 삭제된 게시글입니다.", { id: "post-missing-toast" });
          router.replace("/board");
          return;
        }
        if (!postRes.ok) throw new Error(`status ${postRes.status}`);

        const postData = await postRes.json();

        // 3) 작성자 본인이 아니면 폼에 내용을 채우기 전에 돌려보냅니다.
        if (!isResourceOwner(me, { id: postData.author_id, username: postData.author })) {
          toast.error("본인이 작성한 글만 수정할 수 있습니다.", { id: "not-owner-toast" });
          router.replace(`/board/${postId}`);
          return;
        }

        const loadedTitle = postData.title ?? "";
        const loadedContent = postData.content ?? "";
        setTitle(loadedTitle);
        setContent(loadedContent);
        setInitial({ title: loadedTitle, content: loadedContent });
        setIsLoadingData(false); // 모든 검사를 통과한 경우에만 폼을 보여줍니다.
      } catch (err) {
        console.error("Initialize Edit Page Error:", err);
        setLoadError(true); // 빈 폼 대신 오류 화면을 보여줍니다.
        setIsLoadingData(false);
      }
    };

    initializePage();
  }, [postId, router, reloadKey]);

  const handleCancelRequest = () => {
    // 변경 사항이 없으면 확인 없이 바로 돌아갑니다.
    if (!isDirty) {
      router.push(`/board/${postId}`);
      return;
    }

    openModal({
      title: "수정 취소 ✍️",
      message: "수정 중이던 내용이 저장되지 않고 원래대로 돌아갑니다. 수정을 취소하시겠습니까?",
      confirmText: "수정 취소",
      cancelText: "계속 수정",
      onConfirm: () => {
        router.push(`/board/${postId}`);
      },
    });
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const nextTitle = title.trim();
    const nextContent = content.trim();

    if (!nextTitle || !nextContent) {
      toast.warning("제목과 내용을 모두 입력해 주세요! ✍️");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await clientFetch(`/api/board/posts/${postId}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle, content: nextContent }),
      });

      if (!res.ok) {
        // 401은 clientFetch가 세션 만료 모달을 띄웁니다. 여기서는 작성 내용을 유지한 채 안내만 합니다.
        toast.error(await getApiErrorMessage(res, "게시글 수정에 실패했습니다.", FIELD_LABELS));

        // 권한이 없거나 이미 삭제된 글이면 머물러도 의미가 없으므로 이동
        if (res.status === 403) router.replace(`/board/${postId}`);
        if (res.status === 404) router.replace("/board");
        return;
      }

      // 저장된 값을 새 원본으로 반영해 "변경 없음" 상태로 만든 뒤 이동합니다.
      setTitle(nextTitle);
      setContent(nextContent);
      setInitial({ title: nextTitle, content: nextContent });

      toast.success("🎉 게시글이 성공적으로 수정되었습니다!");
      router.push(`/board/${postId}`);
      router.refresh();
    } catch (err) {
      console.error("Edit Post Error:", err);
      toast.error(getNetworkErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ⚠️ 아래 early return은 반드시 모든 훅 호출보다 뒤에 있어야 합니다. (훅 순서 변경 방지)
  if (isLoadingData) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex items-center justify-center">
        <p className="text-sm font-medium text-[#8E8781] animate-pulse">기존 이야기를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-black text-[#2D2A28] mb-2">게시글을 불러오지 못했습니다</p>
        <p className="text-sm text-[#8E8781] mb-6">
          서버가 시작되는 중일 수 있어요. 잠시 후 다시 시도해 주세요.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setLoadError(false);
              setIsLoadingData(true);
              setReloadKey((k) => k + 1);
            }}
            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-full text-sm font-bold"
          >
            🔄 다시 시도하기
          </button>
          <button
            type="button"
            onClick={() => router.push(`/board/${postId}`)}
            className="bg-white border border-[#F0EDE5] text-[#8E8781] px-6 py-3 rounded-full text-sm font-bold"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] text-[#4A4543] py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-black text-[#2D2A28] tracking-tight mb-2">이야기 수정하기</h1>
          <p className="text-sm text-[#8E8781]">실수했거나 더 정돈하고 싶은 문장이 있다면 다듬어주세요.</p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.04)] border border-[#F0EDE5] p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-xs font-bold text-[#8E8781] uppercase tracking-wider mb-2 pl-1"
              >
                제목
              </label>
              <input
                id="title"
                type="text"
                value={title}
                maxLength={TITLE_MAX}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력해 주세요"
                className="w-full bg-[#FAF9F6] border border-[#F0EDE5] rounded-2xl px-5 py-4 text-sm font-semibold text-[#2D2A28] focus:outline-none focus:border-teal-500 transition-colors placeholder-[#CCC5C0]"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="block text-xs font-bold text-[#8E8781] uppercase tracking-wider mb-2 pl-1"
              >
                내용
              </label>
              <textarea
                id="content"
                rows={10}
                value={content}
                maxLength={CONTENT_MAX}
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
                disabled={isSubmitting}
                className="bg-[#FAF9F6] border border-[#F0EDE5] text-[#8E8781] px-6 py-3 rounded-full text-sm font-bold hover:bg-[#F0EDE5] transition-colors disabled:opacity-50"
              >
                수정 취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#2D2A28] text-white px-8 py-3 rounded-full text-sm font-bold shadow-md hover:bg-teal-600 transition-colors disabled:bg-[#CCC5C0] min-w-[120px]"
              >
                {isSubmitting ? "수정 중..." : "✍️ 수정 완료"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}