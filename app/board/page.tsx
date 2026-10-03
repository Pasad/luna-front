import Link from "next/link";
import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/api";
import { parsePositiveInt } from "@/lib/validators";

interface Post {
  id: number;
  title: string;
  author: string;
  created_at: string;
}

// 백엔드 페이징 규격에 맞춰 감싸진 인터페이스 정의
interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Post[];
}

// Next.js 15+ 규격에 맞추어 searchParams를 Promise 형태로 정의
interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

// 게시글 목록을 가져오는 비동기 함수
async function getPosts(page: number): Promise<PaginatedResponse> {
  const res = await serverFetch(`/api/board/posts/?page=${page}`, { cache: "no-store" });

  if (res.status === 404) notFound();   // 범위를 벗어난 페이지
  if (!res.ok) throw new Error("게시글 목록을 불러오는 데 실패했습니다.");
  return await res.json();
}

export default async function BoardPage({ searchParams }: PageProps) {
  // Promise로 넘어오는 searchParams를 안전하게 풀어내고 현재 페이지 파악 (기본값 "1")
  const resolvedSearchParams = await searchParams;
  const pageNumber = parsePositiveInt(resolvedSearchParams.page);

  const data = await getPosts(pageNumber);
  const posts = data.results; // 기존의 배열은 results 안에 들어있습니다.

  // 하단 네비게이션용 총 페이지 수 계산 (백엔드 세팅과 동일하게 5개 기준)
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(data.count / ITEMS_PER_PAGE);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] text-[#4A4543] py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black text-[#2D2A28]">커뮤니티 게시판</h1>
          <Link href="/board/write" className="bg-[#2D2A28] text-white px-6 py-3 rounded-full text-sm font-bold shadow-md">
            📝 새 글 쓰기
          </Link>
        </div>

        {/* 게시판 리스트 테이블 영역 */}
        <div className="bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.04)] border border-[#F0EDE5] overflow-hidden mb-8">
          {posts.length === 0 ? (
            <div className="text-center py-24">
              <span className="text-4xl block mb-4">🍃</span>
              <p className="text-[#8E8781] font-medium">아직 등록된 게시글이 없습니다.</p>
              <p className="text-xs text-[#CCC5C0] mt-1">첫 번째 주인공이 되어 이야기를 들려주세요!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F0EDE5] bg-[#FAF9F6]/50">
                    <th className="p-5 pl-8 text-xs font-bold text-[#8E8781] uppercase tracking-wider w-20 text-center">번호</th>
                    <th className="p-5 text-xs font-bold text-[#8E8781] uppercase tracking-wider">제목</th>
                    <th className="p-5 text-xs font-bold text-[#8E8781] uppercase tracking-wider w-32 text-center">작성자</th>
                    <th className="p-5 pr-8 text-xs font-bold text-[#8E8781] uppercase tracking-wider w-32 text-center">작성일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE5]">
                  {posts.map((post) => {
                    const formattedDate = new Date(post.created_at)
                      .toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      })
                      .replace(/\s/g, "");

                    return (
                      <tr 
                        key={post.id} 
                        className="hover:bg-[#FAF9F6]/30 transition-colors group cursor-pointer"
                      >
                        <td className="p-5 pl-8 text-sm text-[#8E8781] text-center font-medium">
                          {post.id}
                        </td>
                        <td className="p-5 text-sm font-semibold text-[#2D2A28]">
                          <Link 
                            href={`/board/${post.id}`} 
                            className="group-hover:text-teal-500 transition-colors block"
                          >
                            {post.title}
                          </Link>
                        </td>
                        <td className="p-5 text-sm text-[#4A4543] text-center font-medium">
                          <span className="bg-[#FAF9F6] px-3 py-1 rounded-full border border-[#F0EDE5] text-xs">
                            {post.author}
                          </span>
                        </td>
                        <td className="p-5 pr-8 text-xs text-[#8E8781] text-center font-medium whitespace-nowrap">
                          {formattedDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 하단 페이지 네비게이션 컨트롤 영역 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            {/* [이전] 버튼 */}
            <Link
              href={`/board?page=${pageNumber - 1}`}
              className={`px-4 py-2 text-xs font-bold rounded-full border transition-colors ${
                pageNumber <= 1
                  ? "pointer-events-none border-[#F0EDE5] text-[#CCC5C0]"
                  : "border-[#F0EDE5] bg-white text-[#8E8781] hover:bg-[#F0EDE5]"
              }`}
            >
              이전
            </Link>

            {/* 숫자 페이지 컨트롤 링크 루프 */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <Link
                key={num}
                href={`/board?page=${num}`}
                className={`w-9 h-9 flex items-center justify-center text-xs font-bold rounded-full border transition-all ${
                  num === pageNumber
                    ? "bg-[#2D2A28] border-[#2D2A28] text-white shadow-sm"
                    : "bg-white border-[#F0EDE5] text-[#8E8781] hover:bg-[#F0EDE5]"
                }`}
              >
                {num}
              </Link>
            ))}

            {/* [다음] 버튼 */}
            <Link
              href={`/board?page=${pageNumber + 1}`}
              className={`px-4 py-2 text-xs font-bold rounded-full border transition-colors ${
                pageNumber >= totalPages
                  ? "pointer-events-none border-[#F0EDE5] text-[#CCC5C0]"
                  : "border-[#F0EDE5] bg-white text-[#8E8781] hover:bg-[#F0EDE5]"
              }`}
            >
              다음
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}