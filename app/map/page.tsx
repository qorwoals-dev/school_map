"use client";

import React, { useEffect } from "react";
import Header from "@/components/common/Header";
import SchoolModal from "@/components/common/SchoolModal";
import FilterBar from "@/components/map/FilterBar";
import MapContainer from "@/components/map/MapContainer";
import BottomSheet from "@/components/map/BottomSheet";
import PlaceDetailModal from "@/components/place/PlaceDetailModal";
import { useAppStore } from "@/lib/store/useAppStore";
import { getStoredPreferences } from "@/lib/supabase/service";

export default function MapPage() {
  const {
    activeSchool,
    activeCategory,
    setPlaces,
    setIsLoadingPlaces,
    setPreferences,
    viewMode,
  } = useAppStore();

  // 1. 초기 온보딩 선호도 복원
  useEffect(() => {
    const stored = getStoredPreferences();
    if (stored) {
      setPreferences(stored);
    }
  }, [setPreferences]);

  // 2. 학교나 필터 카테고리가 변경될 때 장소 API 호출
  useEffect(() => {
    let isCancelled = false;

    async function fetchPlacesData() {
      setIsLoadingPlaces(true);
      try {
        const queryParams = new URLSearchParams({
          schoolId: activeSchool.id,
          lat: activeSchool.lat.toString(),
          lng: activeSchool.lng.toString(),
          category: activeCategory,
          radius: "1500",
        });

        const res = await fetch(`/api/places?${queryParams.toString()}`);
        const data = await res.json();

        if (!isCancelled && data.success && Array.isArray(data.data)) {
          setPlaces(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch places:", err);
      } finally {
        if (!isCancelled) {
          setIsLoadingPlaces(false);
        }
      }
    }

    fetchPlacesData();

    return () => {
      isCancelled = true;
    };
  }, [activeSchool, activeCategory, setPlaces, setIsLoadingPlaces]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#ffffff] overflow-hidden">
      {/* 1. 상단 글로벌 네비게이션 헤더 */}
      <Header />

      {/* 2. 카테고리 필터 칩 바 */}
      <FilterBar />

      {/* 3. 메인 콘텐츠 영역 (지도 + 리스트 바텀시트) */}
      <main className="relative flex-1 w-full overflow-hidden flex">
        {/* 데스크톱 및 모바일 지도 (목록 뷰 모드일 때는 모바일에서 숨김 처리) */}
        <div
          className={`relative flex-1 w-full h-full ${
            viewMode === "LIST" ? "hidden md:block" : "block"
          }`}
        >
          <MapContainer />
        </div>

        {/* 바텀시트 / 사이드패널 리스트 */}
        <BottomSheet />
      </main>

      {/* 모달 레이어 */}
      <SchoolModal />
      <PlaceDetailModal />
    </div>
  );
}
