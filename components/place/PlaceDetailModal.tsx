"use client";

import React from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import {
  X,
  Star,
  Heart,
  MapPin,
  Clock,
  Phone,
  Navigation,
  ExternalLink,
  Sparkles,
  Utensils,
  Share2,
} from "lucide-react";

export default function PlaceDetailModal() {
  const { selectedPlace, setSelectedPlace, toggleBookmark, isBookmarked, activeSchool } =
    useAppStore();

  if (!selectedPlace) return null;

  const bookmarked = isBookmarked(selectedPlace.id);

  // 카카오 및 네이버 지도 길찾기 URL 생성
  const kakaoDirectionsUrl = `https://map.kakao.com/link/to/${encodeURIComponent(
    selectedPlace.name
  )},${selectedPlace.lat},${selectedPlace.lng}`;

  const naverDirectionsUrl = `https://map.naver.com/v5/search/${encodeURIComponent(
    selectedPlace.name
  )}`;

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: `${selectedPlace.name} - 캠퍼스 스팟`,
        text: `${activeSchool.name} 주변 맛집 추천: ${selectedPlace.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("링크가 클립보드에 복사되었습니다!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-airbnb-float border border-[#ebebeb] overflow-hidden flex flex-col max-h-[90vh]">
        {/* 상단 이미지 및 액션 버튼들 */}
        <div className="relative w-full h-56 sm:h-64 bg-[#f2f2f2] flex-shrink-0">
          <img
            src={selectedPlace.imageUrl}
            alt={selectedPlace.name}
            className="w-full h-full object-cover"
          />

          {/* 닫기 버튼 */}
          <button
            onClick={() => setSelectedPlace(null)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#222222] shadow-airbnb transition-transform active:scale-95"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 공유 버튼 */}
          <button
            onClick={handleShare}
            className="absolute top-3 right-14 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#222222] shadow-airbnb transition-transform active:scale-95"
            title="공유하기"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* 학생 추천 뱃지 */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#222222] shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ff385c]"></span>
            캠퍼스 인증 스팟
          </div>
        </div>

        {/* 본문 상세 내용 */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* 장소 타이틀 & 평점 */}
          <div>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#222222]">
                {selectedPlace.name}
              </h2>
              <div className="flex items-center gap-1 bg-[#f7f7f7] px-2.5 py-1 rounded-full text-sm font-bold text-[#222222] flex-shrink-0">
                <Star className="w-4 h-4 fill-[#222222] text-[#222222]" />
                <span>{selectedPlace.rating.toFixed(1)}</span>
                <span className="text-xs text-[#6a6a6a] font-normal">
                  ({selectedPlace.reviewCount})
                </span>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-[#6a6a6a] mt-1 flex items-center gap-2">
              <span>{selectedPlace.categoryName}</span>
              <span>·</span>
              <span className="font-semibold text-[#ff385c]">
                {activeSchool.shortName || activeSchool.name} 정문에서 {selectedPlace.distanceMeters}m (도보 {Math.max(1, Math.round(selectedPlace.distanceMeters / 65))}분)
              </span>
            </div>
          </div>

          {/* 커스텀 태그 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedPlace.customTags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold text-[#ff385c] bg-[#fff0f3] px-2.5 py-1 rounded-full border border-[#ffd1da]"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 선배들의 학생 꿀팁 배너 */}
          {selectedPlace.studentTip && (
            <div className="bg-[#fff9eb] border border-[#fde68a] p-3.5 rounded-2xl flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-[#d97706] flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-[#92400e]">재학생 실전 꿀팁</div>
                <div className="text-xs text-[#78350f] mt-0.5 leading-relaxed">
                  {selectedPlace.studentTip}
                </div>
              </div>
            </div>
          )}

          {/* 대표 메뉴 */}
          {selectedPlace.popularMenu && selectedPlace.popularMenu.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#6a6a6a] uppercase tracking-wider mb-2 flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5" />
                대표 인기 메뉴
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedPlace.popularMenu.map((menu, idx) => (
                  <span
                    key={idx}
                    className="bg-[#f7f7f7] text-[#222222] text-xs font-medium px-3 py-1.5 rounded-lg border border-[#ebebeb]"
                  >
                    {menu}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 상세 정보 목록 */}
          <div className="space-y-2.5 pt-2 border-t border-[#ebebeb] text-xs sm:text-sm text-[#3f3f3f]">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-[#6a6a6a] flex-shrink-0" />
              <span>{selectedPlace.address}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#6a6a6a] flex-shrink-0" />
              <span>{selectedPlace.operatingHours}</span>
            </div>

            {selectedPlace.phone && (
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#6a6a6a] flex-shrink-0" />
                <a
                  href={`tel:${selectedPlace.phone}`}
                  className="text-[#222222] font-medium hover:underline"
                >
                  {selectedPlace.phone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 액션 버튼 (Airbnb Rausch CTA Button) */}
        <div className="p-4 border-t border-[#ebebeb] bg-white flex items-center gap-2">
          {/* 찜하기 버튼 */}
          <button
            onClick={() => toggleBookmark(selectedPlace)}
            className="w-12 h-12 rounded-xl border border-[#dddddd] flex items-center justify-center flex-shrink-0 hover:bg-[#f7f7f7] transition-all"
            title="북마크"
          >
            <Heart
              className={`w-5 h-5 ${
                bookmarked ? "fill-[#ff385c] text-[#ff385c]" : "text-[#222222]"
              }`}
            />
          </button>

          {/* 카카오 길찾기 CTA */}
          <a
            href={kakaoDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-12 bg-[#ff385c] hover:bg-[#e00b41] active:bg-[#e00b41] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>카카오맵 길찾기</span>
          </a>

          {/* 네이버 지도 바로가기 */}
          <a
            href={naverDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 px-3.5 bg-[#f7f7f7] hover:bg-[#ebebeb] text-[#222222] font-semibold text-xs rounded-xl flex items-center justify-center gap-1 border border-[#dddddd] transition-all"
            title="네이버 지도에서 보기"
          >
            <span>네이버 지도</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
