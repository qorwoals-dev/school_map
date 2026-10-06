import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "캠퍼스 스팟 (Campus Spot) | 학교 주변 학생 맞춤 맛집 & 편의시설 지도",
  description:
    "혼밥, 가성비, 카공 스터디카페, 24시 시설까지! 대학생과 중·고등학생의 라이프스타일에 맞춘 실시간 캠퍼스 지도 서비스",
  keywords: ["학교맛집", "대학가혼밥", "가성비맛집", "카공카페", "24시편의시설", "캠퍼스지도"],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* Leaflet CSS for Map Rendering */}
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="antialiased selection:bg-[#ffd1da] selection:text-[#ff385c]">
        {children}
      </body>
    </html>
  );
}
