// app/layout.tsx
import { Metadata } from "next";
import React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import AuthInitializer from "@/components/common/AuthInitializer";
import GlobalModal from "@/components/common/GlobalModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Luna Project",
  description: "Jeju Humidity & Board",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {/* 최초 앱 진입 시 Zustand 스토어의 checkLoginStatus를 실행해 줄 컴포넌트 */}
        <AuthInitializer />

        <Navbar />
        <main className="pt-20">{children}</main>

        {/* 전역 커스텀 모달 */}
        <GlobalModal />
        
        {/* 토스트 */}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}