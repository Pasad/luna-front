'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { clientFetch } from '@/lib/api';
import SafeImage from '@/components/common/SafeImage';
import AlbumDetailModal from './AlbumDetailModal';
import AlbumCreateModal from './AlbumCreateModal';

export interface Album {
  id: number;
  author_id?: number;
  author_username: string;
  image_url: string;
  caption: string;
  location?: string;
  created_at: string;
}

export interface AlbumListProps {
  initialAlbums: Album[];
  loadFailed?: boolean;
}

const extractAlbums = (data: unknown): Album[] => {
  if (Array.isArray(data)) return data as Album[];
  const results = (data as { results?: unknown } | null)?.results;
  return Array.isArray(results) ? (results as Album[]) : [];
};

export default function AlbumList({ initialAlbums, loadFailed = false }: AlbumListProps) {
  const [albums, setAlbums] = useState<Album[]>(() => extractAlbums(initialAlbums));
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loadError, setLoadError] = useState(loadFailed);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const res = await clientFetch('/api/albums/', { method: 'GET' });
      if (!res.ok) throw new Error(`status ${res.status}`);

      setAlbums(extractAlbums(await res.json()));
      setLoadError(false);
    } catch (err) {
      console.error('목록 새로고침 실패:', err);
      setLoadError(true);
      toast.error('앨범 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const retryButton = (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="mt-4 bg-[#2D2A28] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-teal-600 transition-colors disabled:opacity-60"
    >
      {isRefreshing ? '불러오는 중...' : '🔄 다시 시도하기'}
    </button>
  );

  return (
    <>
      <div className="flex justify-end mb-6">
        {isLoggedIn && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            + 새 사진 등록
          </button>
        )}
      </div>

      {loadError && albums.length > 0 && (
        <div role="alert" className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          최신 목록을 불러오지 못했습니다. 아래 목록은 이전 상태일 수 있어요.
          <div>{retryButton}</div>
        </div>
      )}

      {albums.length === 0 ? (
        loadError ? (
          <div role="alert" className="text-center py-20 text-gray-500">
            <p>앨범을 불러오지 못했습니다.</p>
            <p className="text-xs mt-1">서버가 시작되는 중일 수 있어요. 잠시 후 다시 시도해 주세요.</p>
            {retryButton}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">아직 등록된 사진이 없습니다.</div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              role="button"
              tabIndex={0}
              aria-label={`${album.author_username}님의 사진: ${album.caption || '설명 없음'}`}
              onClick={() => setSelectedAlbum(album)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedAlbum(album);
                }
              }}
              className="group bg-white rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition cursor-pointer focus-visible:outline-2 focus-visible:outline-teal-500"
            >
              <div className="aspect-square w-full overflow-hidden bg-gray-100">
                <SafeImage
                  src={album.image_url}
                  alt={album.caption || '앨범 이미지'}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <div className="p-3">
                <p className="text-xs text-gray-400">@{album.author_username}</p>
                <p className="text-sm font-medium text-gray-800 truncate mt-1">
                  {album.caption || '설명 없음'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedAlbum && (
        <AlbumDetailModal
          album={selectedAlbum}
          onClose={() => setSelectedAlbum(null)}
          onUpdated={() => {
            setSelectedAlbum(null);
            handleRefresh();
          }}
        />
      )}

      {isCreateOpen && (
        <AlbumCreateModal
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            handleRefresh();
          }}
        />
      )}
    </>
  );
}