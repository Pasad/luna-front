'use client';

import React, { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { useModalStore } from '@/store/useModalStore';
import { clientFetch } from '@/lib/api';
import { getApiErrorMessage, getNetworkErrorMessage } from '@/lib/errors';
import { isResourceOwner } from '@/lib/ownership';
import { useDialog } from '@/lib/useDialog';
import SafeImage from '@/components/common/SafeImage';
import { Album } from './AlbumList';
import AlbumEditModal from './AlbumEditModal';

interface AlbumDetailModalProps {
  album: Album;
  onClose: () => void;
  onUpdated: () => void;
}

export default function AlbumDetailModal({ album, onClose, onUpdated }: AlbumDetailModalProps) {
  const { isLoggedIn, user } = useAuthStore();
  const { openModal } = useModalStore();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(dialogRef, onClose);

  const isOwner =
    isLoggedIn && isResourceOwner(user, { id: album.author_id, username: album.author_username });

  // 삭제 실행 로직
  const executeDelete = async () => {
    try {
      const res = await clientFetch(`/api/albums/${album.id}/`, { method: 'DELETE' });

      if (res.ok) {
        toast.success('추억이 삭제되었습니다.');
        onUpdated();
      } else if (res.status === 404) {
        toast.info('이미 삭제된 항목입니다.');
        onUpdated(); // 목록을 새로 불러와 화면과 서버 상태를 맞춥니다.
      } else {
        toast.error(await getApiErrorMessage(res, '삭제에 실패했습니다.'));
      }
    } catch (err) {
      console.error('삭제 오류:', err);
      toast.error(getNetworkErrorMessage(err));
    }
  };

  const handleDeleteClick = () => {
    openModal({
      title: '앨범 삭제',
      message: '정말 이 추억을 삭제하시겠습니까?\n삭제된 내용은 복구할 수 없습니다.',
      confirmText: '삭제하기',
      cancelText: '취소',
      onConfirm: executeDelete,
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#2D2A28]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`${album.author_username}님의 사진 상세`}
          tabIndex={-1}
          className="bg-white rounded-[2rem] max-w-2xl w-full overflow-hidden shadow-2xl border border-[#F0EDE5] relative max-h-[90vh] flex flex-col focus:outline-none"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 z-10 transition-colors"
          >
            ✕
          </button>

          <div className="overflow-y-auto">
            <SafeImage
              src={album.image_url}
              alt={album.caption || '상세 이미지'}
              className="w-full max-h-[500px] min-h-48 object-contain bg-black"
            />

            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#2D2A28]">@{album.author_username}</span>
                  {album.location && (
                    <span className="bg-[#FAF9F6] border border-[#F0EDE5] text-teal-700 text-xs px-3 py-1 rounded-full font-medium">
                      📍 {album.location}
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#8E8781]">
                  {new Date(album.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-[#2D2A28] whitespace-pre-line text-sm leading-relaxed mb-6">
                {album.caption}
              </p>

              {isOwner && (
                <div className="flex justify-end space-x-3 pt-4 border-t border-[#F0EDE5]">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(true)}
                    className="px-4 py-2 text-sm text-[#8E8781] hover:bg-[#FAF9F6] rounded-full font-bold transition-colors"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 rounded-full font-bold transition-colors"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditOpen && (
        <AlbumEditModal
          album={album}
          onClose={() => setIsEditOpen(false)}
          onSuccess={() => {
            setIsEditOpen(false);
            onUpdated();
          }}
        />
      )}
    </>
  );
}