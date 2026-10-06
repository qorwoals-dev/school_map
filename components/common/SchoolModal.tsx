"use client";

import React, { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { School } from "@/types";
import { Search, X, MapPin, Check, GraduationCap } from "lucide-react";
import { SCHOOLS_DATA } from "@/lib/data/schools";

export default function SchoolModal() {
  const { isSchoolModalOpen, setIsSchoolModalOpen, activeSchool, setActiveSchool } =
    useAppStore();
  const [keyword, setKeyword] = useState("");
  const [schools, setSchools] = useState<School[]>(SCHOOLS_DATA);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isSchoolModalOpen) return;
    setKeyword("");
    setSchools(SCHOOLS_DATA);
  }, [isSchoolModalOpen]);

  // 검색 디바운스
  useEffect(() => {
    if (!keyword.trim()) {
      setSchools(SCHOOLS_DATA);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/schools?keyword=${encodeURIComponent(keyword)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setSchools(data.data);
        }
      } catch (e) {
        // Fallback filter
        const lower = keyword.toLowerCase();
        setSchools(
          SCHOOLS_DATA.filter(
            (s) =>
              s.name.toLowerCase().includes(lower) ||
              (s.shortName && s.shortName.toLowerCase().includes(lower)) ||
              s.region.toLowerCase().includes(lower)
          )
        );
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [keyword]);

  if (!isSchoolModalOpen) return null;

  const handleSelect = (school: School) => {
    setActiveSchool(school);
    setIsSchoolModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-airbnb-float border border-[#dddddd] overflow-hidden flex flex-col max-h-[85vh]">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#ebebeb]">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#ff385c]" />
            <h2 className="text-lg font-bold text-[#222222]">학교 선택 및 변경</h2>
          </div>
          <button
            onClick={() => setIsSchoolModalOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-[#f7f7f7] flex items-center justify-center text-[#6a6a6a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 검색 입력창 (Airbnb Pill Search Style) */}
        <div className="p-4 border-b border-[#ebebeb] bg-[#fbfbfb]">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#6a6a6a] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="대학교 또는 고등학교 명칭을 입력하세요 (예: 건국대, 홍익대)"
              className="w-full pl-10 pr-4 py-2.5 bg-white text-sm border border-[#dddddd] rounded-full focus:outline-none focus:border-[#222222] shadow-sm transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* 학교 목록 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 divide-y divide-[#f2f2f2]">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-[#6a6a6a]">학교를 검색하는 중...</div>
          ) : schools.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#6a6a6a]">
              검색된 학교가 없습니다. 다른 검색어를 입력해보세요.
            </div>
          ) : (
            schools.map((school) => {
              const isSelected = activeSchool.id === school.id;
              return (
                <button
                  key={school.id}
                  onClick={() => handleSelect(school)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? "bg-[#fff0f3] border border-[#ffd1da]"
                      : "hover:bg-[#f7f7f7] border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-[#ff385c] text-white"
                          : "bg-[#f2f2f2] text-[#6a6a6a]"
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#222222] flex items-center gap-1.5">
                        {school.name}
                        {school.shortName && (
                          <span className="text-[11px] font-normal text-[#6a6a6a] bg-gray-100 px-1.5 py-0.5 rounded">
                            {school.shortName}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#6a6a6a] mt-0.5">
                        {school.address}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="flex items-center text-[#ff385c] text-xs font-semibold gap-1">
                      <Check className="w-4 h-4" />
                      선택됨
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="px-6 py-3 border-t border-[#ebebeb] bg-[#fcfcfc] text-xs text-[#6a6a6a] flex justify-between items-center">
          <span>선택한 학교를 중심으로 반경 내 맛집/시설이 정렬됩니다.</span>
          <button
            onClick={() => setIsSchoolModalOpen(false)}
            className="text-xs font-medium text-[#222222] hover:underline"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
