// lib/useDialog.ts
import { useEffect, useRef, type RefObject } from "react";
import { useModalStore } from "@/store/useModalStore";
import { lockBodyScroll } from "@/lib/scrollLock";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// 다이얼로그가 겹쳐 있을 때 맨 위의 것만 키 입력에 반응하도록 순서를 기록합니다.
const dialogStack: symbol[] = [];

export function useDialog(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  { disabled = false }: { disabled?: boolean } = {}
) {
  const onCloseRef = useRef(onClose);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onCloseRef.current = onClose;
    disabledRef.current = disabled;
  });

  useEffect(() => {
    const id = Symbol("dialog");
    dialogStack.push(id);

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const unlockScroll = lockBodyScroll();
    ref.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== id) return; // 맨 위 모달만
      if (e.defaultPrevented || useModalStore.getState().isOpen) return; // 전역 모달이 우선

      const dialog = ref.current;
      if (!dialog) return;

      if (e.key === "Escape") {
        if (disabledRef.current) return; // 전송 중에는 닫지 않음
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== "Tab") return;

      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusables.length === 0) {
        e.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || active === dialog || !dialog.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const index = dialogStack.indexOf(id);
      if (index >= 0) dialogStack.splice(index, 1);
      unlockScroll();
      previouslyFocused?.focus?.();
    };
  }, [ref]);
}