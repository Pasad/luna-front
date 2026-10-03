// app/board/error.tsx
"use client";

import ErrorView from "@/components/common/ErrorView";

export default function BoardError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorView
      {...props}
      title="게시판을 불러오지 못했습니다"
      description="서버가 깨어나는 중이거나 일시적인 문제일 수 있어요. 무료 서버는 시작하는 데 30초~1분 정도 걸릴 수 있으니, 잠시 후 다시 시도해 주세요."
    />
  );
}