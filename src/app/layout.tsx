import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "유아 디지털 역량 설문조사",
  description: "유아의 디지털 역량을 알아보기 위한 설문조사입니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
