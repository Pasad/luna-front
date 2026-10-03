// store/useModalStore.ts
import { create } from "zustand";

interface ModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ModalState {
  isOpen: boolean;
  options: ModalOptions | null;
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  options: null,

  // 모달 열기 함수 (옵션 객체를 받아 상태에 바인딩)
  openModal: (options) => set({ isOpen: true, options }),
  
  // 모달 닫기 및 옵션 초기화
  closeModal: () => set({ isOpen: false, options: null }),
}));