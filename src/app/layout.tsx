import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Link Quration",
  description: "링크 큐레이션을 통해 웹 리소스를 체계적으로 관리하고, AI 분석을 활용한 스마트한 북마크 관리 서비스입니다. 카테고리별 정리, 태그 기반 검색, AI 추천 기능으로 효율적인 웹 서핑을 경험해보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
