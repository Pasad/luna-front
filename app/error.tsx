// app/error.tsx
"use client";

import ErrorView from "@/components/common/ErrorView";

export default function RootError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorView
      {...props}
      title="문제가 발생했습니다"
      description="일시적인 오류일 수 있어요. 잠시 후 다시 시도해 주세요. 문제가 계속되면 관리자에게 문의해 주세요."
    />
  );
}