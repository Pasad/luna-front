import Link from "next/link";
import { notFound } from "next/navigation";
import { serverFetch } from "@/lib/api";
import { isNumericId } from "@/lib/validators";
import ActionButtons from "./ActionButtons";

interface Post {
  id: number;
  title: string;
  author: string;
  author_id?: number;
  created_at: string;
  content?: string; 
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPostDetail(id: string): Promise<Post> {
  const res = await serverFetch(`/api/board/posts/${id}/`, { cache: "no-store" });
  if (res.status === 404) notFound();   // 없는 글은 404 화면
  if (!res.ok) throw new Error("게시글을 불러오는 데 실패했습니다.");
  return await res.json();
}

export default async function PostDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  if (!isNumericId(id)) notFound();
  
  const post = await getPostDetail(id);

  const formattedDate = new Date(post.created_at).toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] text-[#4A4543] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* 목록으로 돌아가기 버튼 */}
        <div className="mb-8">
          <Link
            href="/board"
            className="inline-flex items-center text-sm font-semibold text-[#8E8781] hover:text-teal-500 transition-colors group"
          >
            <span className="inline-block transform group-hover:-translate-x-1 transition-transform mr-2">←</span>
            목록으로 돌아가기
          </Link>
        </div>

        {/* 게시글 본문 카드 */}
        <div className="bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.04)] border border-[#F0EDE5] p-8 sm:p-12">
          
          {/* 메타 정보 (작성자 & 날짜) */}
          <div className="flex items-center gap-3 text-xs font-semibold text-[#8E8781] mb-4">
            <span className="bg-[#FAF9F6] px-3 py-1 rounded-full border border-[#F0EDE5] text-[#2D2A28]">
              ✍️ {post.author}
            </span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>

          {/* 제목 */}
          <h1 className="text-2xl sm:text-3xl font-black text-[#2D2A28] leading-tight mb-8 pb-6 border-b border-[#F0EDE5]">
            {post.title}
          </h1>

          {/* 본문 내용 */}
          <div className="text-base leading-relaxed text-[#4A4543] whitespace-pre-wrap min-h-[200px] mb-6">
            {post.content || "본문 내용이 존재하지 않습니다."}
          </div>

          {/* 2. 본인 여부를 식별하고 제어할 제어 단추 레이어 연결 */}
          <ActionButtons postId={post.id} author={post.author} authorId={post.author_id} />

        </div>

      </div>
    </div>
  );
}