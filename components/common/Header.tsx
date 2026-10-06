"use client";

import React from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { MapPin, SlidersHorizontal, School as SchoolIcon, Heart, Compass } from "lucide-react";
import Link from "next/link";

export default function Header() {
  const { activeSchool, setIsSchoolModalOpen, bookmarks, viewMode, setViewMode } = useAppStore();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-[#ebebeb] px-4 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* 서비스 로고 */}
        <Link href="/map" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#ff385c] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <Compass className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[17px] tracking-tight text-[#222222] leading-none">
              스쿨<span className="text-[#ff385c]">스팟</span>
            </span>
            <span className="text-[10px] text-[#6a6a6a] tracking-wider font-semibold uppercase mt-0.5">
              High School Spot
            </span>
          </div>
        </Link>

        {/* 중앙 학교 선택 캡슐 (Airbnb Search Bar Style) */}
        <button
          onClick={() => setIsSchoolModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 md:py-2 rounded-full border border-[#dddddd] shadow-airbnb hover:shadow-airbnb-float bg-white hover:border-[#b0b0b0] transition-all cursor-pointer max-w-[200px] sm:max-w-xs md:max-w-md"
          title="학교 변경하기"
        >
          <div className="w-6 h-6 rounded-full bg-[#f7f7f7] flex items-center justify-center text-[#ff385c] flex-shrink-0">
            <SchoolIcon className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left truncate">
            <span className="text-xs font-semibold text-[#222222] truncate">
              {activeSchool.name}
            </span>
            <span className="text-[10px] text-[#6a6a6a] truncate hidden sm:block">
              {activeSchool.region} · 중심 반경 탐색
            </span>
          </div>
          <span className="text-[11px] font-medium text-[#ff385c] bg-[#fff0f3] px-2 py-0.5 rounded-full flex-shrink-0 ml-1">
            변경
          </span>
        </button>

        {/* 우측 유틸리티 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* 모바일 뷰 토글 (지도 <-> 목록) */}
          <button
            onClick={() => setViewMode(viewMode === "MAP" ? "LIST" : "MAP")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-[#dddddd] hover:bg-[#f7f7f7] text-[#222222] transition-colors md:hidden"
          >
            {viewMode === "MAP" ? "목록보기" : "지도보기"}
          </button>

          {/* 취향 다시설정 링크 */}
          <Link
            href="/onboarding"
            className="w-9 h-9 rounded-full border border-[#dddddd] hover:bg-[#f7f7f7] flex items-center justify-center text-[#222222] transition-colors"
            title="취향 설문 다시하기"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#6a6a6a]" />
          </Link>

          {/* 북마크 카운터 */}
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[#dddddd] text-xs font-medium text-[#222222]"
            title="찜한 장소 목록"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                bookmarks.length > 0 ? "fill-[#ff385c] text-[#ff385c]" : "text-[#6a6a6a]"
              }`}
            />
            <span>{bookmarks.length}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
