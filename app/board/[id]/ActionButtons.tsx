"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useModalStore } from "@/store/useModalStore";
import { clientFetch } from "@/lib/api";
import { toast } from "sonner";
import { isResourceOwner } from "@/lib/ownership";

interface ActionButtonsProps {
  postId: number;
  author: string;
  authorId?: number;
}

export default function ActionButtons({ postId, author, authorId }: ActionButtonsProps) {
  const router = useRouter();
  const currentUser = useAuthStore((state) => state.user);
  const openModal = useModalStore((state) => state.openModal);

  // 실소유자 권한 판별
  const isOwner = isResourceOwner(currentUser, { id: authorId, username: author });

  // 권한이 없으면 화면을 아예 오염시키지 않고 숨깁니다.
  if (!isOwner) return null;

  const handleDeleteRequest = () => {
    openModal({
      title: "게시글 삭제",
      message: "정말 이 이야기를 삭제하시겠습니까?\n삭제된 글은 다시 복구할 수 없습니다.",
      confirmText: "삭제하기",
      cancelText: "돌아가기",
      onConfirm: async () => {
        try {
          const res = await clientFetch(`/api/board/posts/${postId}/`, {
            method: "DELETE",
          });

          if (res.ok) {
            toast.success("게시글이 안전하게 삭제되었습니다.");
            router.push("/board");
            router.refresh();
          } else if (res.status === 403 || res.status === 401) {
            toast.error("삭제 권한이 없습니다.");
          } else {
            throw new Error();
          }
        } catch (err) {
          console.error("Delete Post Error:", err);
          toast.error("삭제 처리 중 오류가 발생했습니다.");
        }
      },
    });
  };

  return (
    <div className="flex items-center gap-2 pt-6 mt-8 border-t border-[#F0EDE5] animate-in fade-in duration-200">
      <Link 
        href={`/board/write/${postId}`}
        className="text-xs bg-[#FAF9F6] border border-[#F0EDE5] px-4 py-2 rounded-full font-bold text-[#8E8781] hover:bg-[#F0EDE5] transition-colors"
      >
        📝 수정하기
      </Link>
      <button 
        type="button"
        onClick={handleDeleteRequest}
        className="text-xs bg-red-50 border border-red-100 px-4 py-2 rounded-full font-bold text-red-500 hover:bg-red-100 transition-colors"
      >
        🗑️ 삭제하기
      </button>
    </div>
  );
}