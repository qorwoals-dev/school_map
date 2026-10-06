"use client";

import React, { useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import PlaceCard from "@/components/place/PlaceCard";
import { ChevronUp, SlidersHorizontal, MapPin } from "lucide-react";

export default function BottomSheet() {
  const { places, activePlaceId, activeSchool, viewMode } = useAppStore();
  const listRef = useRef<HTMLDivElement>(null);

  // 활성 장소 변경 시 해당 카드로 스크롤
  useEffect(() => {
    if (!activePlaceId || !listRef.current) return;
    const activeEl = listRef.current.querySelector(
      `[data-place-id="${activePlaceId}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activePlaceId]);

  return (
    <div
      className={`transition-all duration-300 ${
        viewMode === "LIST"
          ? "block w-full bg-white z-30"
          : "w-full md:w-96 md:absolute md:left-4 md:top-4 md:bottom-4 md:z-20 md:shadow-airbnb-float md:rounded-3xl md:border md:border-[#ebebeb] md:overflow-hidden md:bg-white"
      }`}
    >
      {/* 모바일 가로 스크롤 카드 바텀 뷰 (지도 뷰일 때) */}
      {viewMode === "MAP" ? (
        <div className="md:hidden absolute bottom-3 left-0 right-0 z-20 px-3 pointer-events-none">
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pointer-events-auto pb-1">
            {places.map((place) => (
              <div key={place.id} data-place-id={place.id} className="flex-shrink-0">
                <PlaceCard place={place} isCompact={true} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 모바일 전체 리스트 뷰 */
        <div className="md:hidden min-h-[calc(100vh-120px)] bg-white px-4 py-4 pb-24">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#222222]">
                {activeSchool.shortName || activeSchool.name} 주변 스팟
              </h2>
              <p className="text-xs text-[#6a6a6a]">
                학생 취향과 거리에 맞춘 추천 장소 {places.length}개
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {places.map((place) => (
              <div key={place.id} data-place-id={place.id}>
                <PlaceCard place={place} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 데스크톱 사이드 패널 */}
      <div className="hidden md:flex flex-col h-full bg-white">
        {/* 사이드바 헤더 */}
        <div className="p-4 border-b border-[#ebebeb] bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#222222]">
                {activeSchool.shortName || activeSchool.name} 주변
              </h2>
              <p className="text-xs text-[#6a6a6a] mt-0.5">
                정문 기준 추천 장소 <span className="font-semibold text-[#ff385c]">{places.length}곳</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#f7f7f7] flex items-center justify-center text-[#ff385c]">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 사이드바 리스트 */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-transparent"
        >
          {places.length === 0 ? (
            <div className="py-20 text-center text-sm text-[#6a6a6a]">
              선택한 카테고리에 해당하는 장소가 없습니다.
            </div>
          ) : (
            places.map((place) => (
              <div key={place.id} data-place-id={place.id}>
                <PlaceCard place={place} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
