// app/global-error.tsx
"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("전역 에러:", error.digest ?? "", error);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF9F6",
          color: "#2D2A28",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>
          서비스에 문제가 발생했습니다
        </h2>
        <p style={{ fontSize: 14, color: "#8E8781", marginBottom: 24 }}>
          잠시 후 다시 시도해 주세요.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            background: "#2D2A28",
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "12px 28px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          새로고침
        </button>
      </body>
    </html>
  );
}