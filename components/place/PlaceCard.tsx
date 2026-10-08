"use client";

import React from "react";
import { Place } from "@/types";
import { useAppStore } from "@/lib/store/useAppStore";
import { Star, Heart, MapPin, Clock, Tag } from "lucide-react";

interface PlaceCardProps {
  place: Place;
  isCompact?: boolean;
}

export default function PlaceCard({ place, isCompact = false }: PlaceCardProps) {
  const { setSelectedPlace, activePlaceId, setActivePlaceId, toggleBookmark, isBookmarked } =
    useAppStore();

  const isSelected = activePlaceId === place.id;
  const bookmarked = isBookmarked(place.id);

  const handleClick = () => {
    setActivePlaceId(place.id);
    setSelectedPlace(place);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative bg-white rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col ${
        isSelected
          ? "border-[#ff385c] shadow-airbnb-float ring-2 ring-[#ff385c]/20"
          : "border-[#ebebeb] hover:border-[#dddddd] shadow-airbnb hover:shadow-airbnb-float"
      } ${isCompact ? "w-72 flex-shrink-0" : "w-full"}`}
    >
      {/* 이미지 썸네일 영역 */}
      <div className="relative w-full h-44 bg-[#f2f2f2] overflow-hidden">
        <img
          src={place.imageUrl}
          alt={place.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* 좌측 상단: 학생 추천 배지 (Airbnb Guest Favorite Badge Style) */}
        <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-bold text-[#222222] shadow-sm flex items-center gap-1 border border-black/5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff385c]"></span>
          학생 추천
        </div>

        {/* 우측 상단: 하트 북마크 버튼 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleBookmark(place);
          }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#222222] shadow-sm transition-transform active:scale-90 hover:scale-105"
          title="찜하기"
        >
          <Heart
            className={`w-4 h-4 ${
              bookmarked ? "fill-[#ff385c] text-[#ff385c]" : "text-[#222222]"
            }`}
          />
        </button>

        {/* 우측 하단 거리 오버레이 */}
        <div className="absolute bottom-2 right-2 bg-black/65 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1">
          <MapPin className="w-3 h-3 text-[#ffd1da]" />
          <span>{place.distanceMeters}m</span>
        </div>
      </div>

      {/* 텍스트 메타 정보 영역 */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          {/* 타이틀 & 평점 */}
          <div className="flex items-start justify-between gap-1">
            <h3 className="font-bold text-[15px] text-[#222222] truncate leading-tight group-hover:text-[#ff385c] transition-colors">
              {place.name}
            </h3>
            <div className="flex items-center gap-0.5 text-xs font-semibold text-[#222222] flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-[#222222] text-[#222222]" />
              <span>{place.rating.toFixed(1)}</span>
              <span className="text-[#6a6a6a] text-[10px] font-normal">({place.reviewCount})</span>
            </div>
          </div>

          {/* 카테고리 & 가격대 */}
          <div className="text-xs text-[#6a6a6a] mt-1 flex items-center gap-1.5 flex-wrap">
            <span>{place.categoryName.split(" > ").pop()}</span>
            <span>·</span>
            <span className="font-medium text-[#222222]">{place.priceRange}</span>
          </div>

          {/* 태그 리스트 */}
          <div className="flex items-center gap-1 mt-2.5 flex-wrap">
            {place.customTags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium text-[#ff385c] bg-[#fff0f3] px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 학생 한줄 팁 */}
        {place.studentTip && (
          <div className="mt-3 pt-2.5 border-t border-[#f2f2f2] text-[11px] text-[#484848] line-clamp-1 italic bg-[#fbfbfb] px-2 py-1 rounded">
            💡 {place.studentTip}
          </div>
        )}
      </div>
    </div>
  );
}
