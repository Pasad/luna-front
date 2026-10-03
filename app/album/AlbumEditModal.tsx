'use client';

import React, { useRef, useState, ChangeEvent, FormEvent } from 'react';
import { toast } from 'sonner';
import { clientFetch } from '@/lib/api';
import { getApiErrorMessage, getNetworkErrorMessage } from '@/lib/errors';
import { ALLOWED_IMAGE_TYPES, validateImageFile } from '@/lib/upload';
import { useDialog } from '@/lib/useDialog';
import { useImagePreview } from '@/lib/useImagePreview';
import { Album } from './AlbumList';

interface AlbumEditModalProps {
  album: Album;
  onClose: () => void;
  onSuccess: () => void;
}

const CAPTION_MAX = 500;
const LOCATION_MAX = 100;
const FIELD_LABELS = { image: '사진', caption: '설명', location: '장소' };

export default function AlbumEditModal({ album, onClose, onSuccess }: AlbumEditModalProps) {
  const [caption, setCaption] = useState(album.caption || '');
  const [location, setLocation] = useState(album.location || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { file, previewUrl, setFile } = useImagePreview(album.image_url);

  const dialogRef = useRef<HTMLDivElement>(null);
  useDialog(dialogRef, onClose, { disabled: isSubmitting });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const error = validateImageFile(selected);
    if (error) {
      toast.error(error);
      e.target.value = '';
      setFile(null); // 원래 이미지로 되돌림
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('location', location.trim()); // 비워도 전송해야 서버에서 지워집니다.
    if (file) formData.append('image', file);

    try {
      const res = await clientFetch(`/api/albums/${album.id}/`, { method: 'PATCH', body: formData });

      if (res.ok) {
        toast.success('수정이 완료되었습니다!');
        onSuccess();
      } else {
        toast.error(await getApiErrorMessage(res, '수정에 실패했습니다. 입력 내용을 확인해 주세요.', FIELD_LABELS));
      }
    } catch (err) {
      console.error('수정 실패:', err);
      toast.error(getNetworkErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#2D2A28]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="album-edit-title"
        tabIndex={-1}
        className="bg-white rounded-[2rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#F0EDE5] relative max-h-[90vh] overflow-y-auto focus:outline-none"
      >
        <h2 id="album-edit-title" className="text-xl font-black text-[#2D2A28] mb-6">추억 수정하기</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="album-edit-image" className="block text-xs font-bold text-[#8E8781] mb-1">
              사진 변경 (선택) <span className="font-normal">(JPG, PNG, WEBP, GIF · 4MB 이하)</span>
            </label>
            <input
              id="album-edit-image"
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(',')}
              onChange={handleFileChange}
              disabled={isSubmitting}
              className="block w-full text-sm text-[#8E8781] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#FAF9F6] file:text-[#2D2A28] hover:file:bg-[#F0EDE5]"
            />
          </div>

          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="미리보기" className="w-full h-48 object-cover rounded-2xl border border-[#F0EDE5]" />
          )}

          <div>
            <label htmlFor="album-edit-location" className="block text-xs font-bold text-[#8E8781] mb-1">장소</label>
            <input
              id="album-edit-location"
              type="text"
              placeholder="장소 (예: 애월 해안도로)"
              value={location}
              maxLength={LOCATION_MAX}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-3 bg-[#FAF9F6] border border-[#F0EDE5] rounded-xl text-sm text-[#2D2A28] focus:outline-none focus:border-[#2D2A28]"
            />
          </div>

          <div>
            <label htmlFor="album-edit-caption" className="block text-xs font-bold text-[#8E8781] mb-1">
              설명 <span className="font-normal">({caption.length}/{CAPTION_MAX})</span>
            </label>
            <textarea
              id="album-edit-caption"
              placeholder="사진에 대한 설명을 적어주세요..."
              value={caption}
              maxLength={CAPTION_MAX}
              onChange={(e) => setCaption(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-3 bg-[#FAF9F6] border border-[#F0EDE5] rounded-xl text-sm text-[#2D2A28] h-28 focus:outline-none focus:border-[#2D2A28]"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-[#8E8781] hover:bg-[#FAF9F6] rounded-full transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm bg-[#2D2A28] text-white font-bold rounded-full shadow-md hover:bg-teal-600 disabled:bg-gray-300 transition-colors"
            >
              {isSubmitting ? '수정 중...' : '수정 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}