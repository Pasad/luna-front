import React from 'react';
import { serverFetch } from '@/lib/api';
import AlbumList, { Album } from './AlbumList';

export const revalidate = 0;

export default async function AlbumPage() {
  let initialAlbums: Album[] = [];
  let loadFailed = false;

  try {
    const res = await serverFetch('/api/albums/');
    if (!res.ok) throw new Error(`status ${res.status}`);

    const data = await res.json();
    initialAlbums = Array.isArray(data) ? data : (data.results ?? []);
  } catch (error) {
    console.error('서버 데이터 로딩 실패:', error);
    loadFailed = true; // "사진 없음"과 "불러오기 실패"를 구분하기 위해 전달
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🌙 제주 앨범</h1>
        <p className="text-gray-500 text-sm mt-1">루나 회원들이 전하는 제주에서의 순간들</p>
      </div>

      <AlbumList initialAlbums={initialAlbums} loadFailed={loadFailed} />
    </div>
  );
}