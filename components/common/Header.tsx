"use client";

import React, { useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { SlidersHorizontal, School as SchoolIcon, Heart, Compass, Locate, Check } from "lucide-react";
import Link from "next/link";
import AuthButton from "./AuthButton";

export default function Header() {
  const {
    activeSchool,
    setIsSchoolModalOpen,
    bookmarks,
    viewMode,
    setViewMode,
    isCurrentLocationMode,
    setIsCurrentLocationMode,
    setCurrentLocation,
  } = useAppStore();

  const [isLocating, setIsLocating] = useState(false);

  // 내 실제 위치 가져오기
  const handleToggleCurrentLocation = () => {
    if (isCurrentLocationMode) {
      // 학교 모드로 복귀
      setIsCurrentLocationMode(false);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      alert("브라우저에서 위치 정보를 지원하지 않습니다.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLocation({ lat, lng, label: "내 현재 위치" });
        setIsCurrentLocationMode(true);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        alert("위치 접근 권한이 필요합니다. 브라우저에서 위치 접근을 허용해주세요.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#ebebeb] px-3 sm:px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* 서비스 로고 */}
        <Link href="/map" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#ff385c] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Compass className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[16px] sm:text-[17px] tracking-tight text-[#222222] leading-none">
              스쿨<span className="text-[#ff385c]">스팟</span>
            </span>
            <span className="text-[10px] text-[#6a6a6a] tracking-wider font-semibold uppercase mt-0.5">
              High School Spot
            </span>
          </div>
        </Link>

        {/* 중앙 탐색 기준 선택 바 (학교 vs 내 위치) */}
        <div className="flex items-center gap-1.5 max-w-[280px] sm:max-w-xs md:max-w-md">
          {/* 학교 선택 캡슐 */}
          <button
            onClick={() => {
              if (isCurrentLocationMode) {
                setIsCurrentLocationMode(false);
              } else {
                setIsSchoolModalOpen(true);
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 md:py-2 rounded-full border transition-all cursor-pointer truncate ${
              !isCurrentLocationMode
                ? "border-[#222222] bg-[#fdfdfd] shadow-sm text-[#222222]"
                : "border-[#dddddd] bg-white text-[#6a6a6a] hover:border-[#222222]"
            }`}
            title="학교 변경 또는 선택"
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              !isCurrentLocationMode ? "bg-[#222222] text-white" : "bg-[#f2f2f2] text-[#6a6a6a]"
            }`}>
              <SchoolIcon className="w-3 h-3" />
            </div>
            <span className="text-xs font-bold truncate">
              {activeSchool.shortName || activeSchool.name}
            </span>
          </button>

          {/* 내 현재 GPS 위치 토글 버튼 */}
          <button
            onClick={handleToggleCurrentLocation}
            className={`flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-full border text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
              isCurrentLocationMode
                ? "bg-[#007aff] text-white border-[#007aff] shadow-sm"
                : "bg-white text-[#6a6a6a] border-[#dddddd] hover:border-[#007aff] hover:text-[#007aff]"
            }`}
            title="내 실제 현재 위치 주변 맛집/시설 탐색"
          >
            <Locate className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">
              {isLocating ? "위치 찾는 중..." : isCurrentLocationMode ? "내 주변 탐색 중" : "내 위치"}
            </span>
            <span className="sm:hidden">
              {isCurrentLocationMode ? "내주변" : "내위치"}
            </span>
          </button>
        </div>

        {/* 우측 유틸리티 */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* 모바일 뷰 토글 (지도 <-> 목록) */}
          <button
            onClick={() => setViewMode(viewMode === "MAP" ? "LIST" : "MAP")}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-full border border-[#dddddd] hover:bg-[#f7f7f7] text-[#222222] transition-colors md:hidden"
          >
            {viewMode === "MAP" ? "목록" : "지도"}
          </button>

          {/* 취향 다시설정 링크 */}
          <Link
            href="/onboarding"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#dddddd] hover:bg-[#f7f7f7] flex items-center justify-center text-[#222222] transition-colors"
            title="취향 설문 다시하기"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6a6a6a]" />
          </Link>

          {/* 북마크 카운터 */}
          <Link
            href="/mypage#bookmarks"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[#dddddd] hover:bg-[#f7f7f7] text-xs font-semibold text-[#222222] transition-colors"
            title="찜한 장소 목록"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                bookmarks.length > 0 ? "fill-[#ff385c] text-[#ff385c]" : "text-[#6a6a6a]"
              }`}
            />
            <span>{bookmarks.length}</span>
          </Link>

          {/* GitHub 로그인 / 프로필 */}
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
