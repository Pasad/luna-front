// components/common/GlobalModal.tsx
"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { useModalStore } from "@/store/useModalStore";
import { lockBodyScroll } from "@/lib/scrollLock";

type ModalOptions = NonNullable<ReturnType<typeof useModalStore.getState>["options"]>;

export default function GlobalModal() {
  const isOpen = useModalStore((state) => state.isOpen);
  const options = useModalStore((state) => state.options);

  // 닫혀 있으면 아무것도 그리지 않습니다. (ModalDialog는 열릴 때마다 새로 마운트됨)
  if (!isOpen || !options) return null;

  return <ModalDialog options={options} />;
}

function ModalDialog({ options }: { options: ModalOptions }) {
  const closeModal = useModalStore((state) => state.closeModal);
  const {
    title,
    message,
    confirmText = "확인",
    cancelText = "취소",
    onConfirm,
    onCancel,
  } = options;

  const [isPending, setIsPending] = useState(false);
  const pendingRef = useRef(false); // 같은 틱의 연타까지 막는 동기 가드
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const titleId = useId();
  const descriptionId = useId();

  // [취소] 배경 클릭 / ESC / 취소 버튼 공통 처리
  const handleCancel = useCallback(() => {
    if (pendingRef.current) return; // 처리 중에는 닫지 않음
    onCancel?.();
    closeModal();
  }, [onCancel, closeModal]);

  // [확인]
  const handleConfirm = async () => {
    if (pendingRef.current) return; // 연타 방지
    pendingRef.current = true;
    setIsPending(true);

    try {
      await onConfirm();
    } catch (err) {
      console.error("Modal onConfirm Error:", err);
      toast.error("처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      pendingRef.current = false;
      setIsPending(false);

      // onConfirm 안에서 다른 모달을 열었다면 그 모달은 닫지 않습니다.
      if (useModalStore.getState().options === options) {
        closeModal();
      }
    }
  };
  
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const unlockScroll = lockBodyScroll();

    cancelButtonRef.current?.focus();

    return () => {
      unlockScroll();
      previouslyFocused?.focus?.();
    };
  }, []);

  // 키보드: ESC로 닫기, Tab 포커스를 모달 안에 가두기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
        return;
      }

      if (e.key !== "Tab") return;

      const dialog = dialogRef.current;
      const focusables = dialog?.querySelectorAll<HTMLElement>("button:not([disabled])");

      // 처리 중이라 버튼이 모두 비활성화된 경우: 포커스가 밖으로 나가지 않게 막음
      if (!dialog || !focusables || focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const isInside = dialog.contains(active);

      if (e.shiftKey && (active === first || !isInside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !isInside)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleCancel]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 배경 딤드 레이어 (바깥 클릭 시 취소) */}
      <div
        className="absolute inset-0 bg-[#2D2A28]/40 backdrop-blur-sm transition-opacity"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* 모달 시트 본체 */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-[#F0EDE5] p-6 sm:p-8 mx-4 transform transition-all animate-in fade-in zoom-in-95 duration-200 focus:outline-none"
      >
        <div className="text-center mb-6">
          <h3 id={titleId} className="text-lg font-black text-[#2D2A28] mb-2">
            {title}
          </h3>
          <p
            id={descriptionId}
            className="text-sm text-[#8E8781] leading-relaxed whitespace-pre-line"
          >
            {message}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="flex-1 bg-[#FAF9F6] border border-[#F0EDE5] text-[#8E8781] py-3.5 rounded-full text-sm font-bold hover:bg-[#F0EDE5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 bg-[#2D2A28] text-white py-3.5 rounded-full text-sm font-bold shadow-md hover:bg-teal-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "처리 중..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}