"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { School, PurposeCategory, FoodCategory, UserCampusPreferences } from "@/types";
import { SCHOOLS_DATA } from "@/lib/data/schools";
import { useAppStore } from "@/lib/store/useAppStore";
import { saveUserPreferences } from "@/lib/supabase/service";
import {
  Compass,
  Search,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  MapPin,
  Utensils,
  Coffee,
  Moon,
  Mic2,
  Wallet,
  Printer,
  GraduationCap,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { setPreferences } = useAppStore();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: 학교 선택 상태 (기본값: 대진전자통신고등학교)
  const [keyword, setKeyword] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School>(SCHOOLS_DATA[0]);

  // Step 2: 고등학생 취향 설문 상태
  const [selectedPurposes, setSelectedPurposes] = useState<PurposeCategory[]>([
    "BUDGET",
    "SOLO",
  ]);
  const [selectedCategories, setSelectedCategories] = useState<FoodCategory[]>([
    "SNACK",
    "KOREAN",
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 학교 필터링
  const filteredSchools = SCHOOLS_DATA.filter((s) => {
    if (!keyword.trim()) return true;
    const lower = keyword.toLowerCase();
    return (
      s.name.toLowerCase().includes(lower) ||
      (s.shortName && s.shortName.toLowerCase().includes(lower)) ||
      s.region.toLowerCase().includes(lower)
    );
  });

  const togglePurpose = (purpose: PurposeCategory) => {
    if (selectedPurposes.includes(purpose)) {
      if (selectedPurposes.length > 1) {
        setSelectedPurposes(selectedPurposes.filter((p) => p !== purpose));
      }
    } else {
      setSelectedPurposes([...selectedPurposes, purpose]);
    }
  };

  const toggleCategory = (cat: FoodCategory) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
      }
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    const prefs: UserCampusPreferences = {
      version: "1.0",
      school: selectedSchool,
      preferences: {
        purposes: selectedPurposes,
        categories: selectedCategories,
      },
      locationMode: "SCHOOL_CENTER",
      radiusMeters: 1000,
      lastUpdated: new Date().toISOString(),
    };

    // 스토어 업데이트
    setPreferences(prefs);

    // Supabase 및 LocalStorage 영속화
    await saveUserPreferences(prefs);

    // 로그인 페이지로 이동
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col justify-between selection:bg-[#ffd1da] selection:text-[#ff385c]">
      {/* 상단 간이 헤더 */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[#ebebeb]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#ff385c] flex items-center justify-center text-white">
            <Compass className="w-4 h-4 stroke-[2.2]" />
          </div>
          <span className="font-bold text-base tracking-tight text-[#222222]">
            스쿨<span className="text-[#ff385c]">스팟</span>
          </span>
          <span className="text-[10px] font-bold text-[#ff385c] bg-[#fff0f3] px-2 py-0.5 rounded-full ml-1">
            고교 맞춤
          </span>
        </div>

        {/* 진행 스텝 표시 */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#222222]">
            Step {step} of 2
          </span>
          <div className="w-16 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#ff385c] transition-all duration-300 rounded-full"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
        </div>
      </header>

      {/* 본문 컨테이너 */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        {step === 1 ? (
          /* STEP 1: 고등학교 선택 */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <span className="text-xs font-bold text-[#ff385c] uppercase tracking-wider">
                HIGH SCHOOL SPOTS
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] mt-1 tracking-tight">
                어느 고등학교 주변을 찾으시나요?
              </h1>
              <p className="text-sm text-[#6a6a6a] mt-2">
                재학 중인 고등학교를 선택하면 하교길 분식, 야자 전 밥집, 스카 지도가 펼쳐집니다.
              </p>
            </div>

            {/* 검색창 */}
            <div className="relative">
              <Search className="w-5 h-5 text-[#6a6a6a] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="고등학교 이름을 검색하세요 (예: 대진전자통신고, 선린, 디미고)"
                className="w-full pl-11 pr-4 py-3.5 bg-[#f7f7f7] hover:bg-[#f0f0f0] focus:bg-white text-sm font-medium border border-transparent focus:border-[#222222] rounded-2xl outline-none shadow-sm transition-all"
              />
            </div>

            {/* 빠른 추천 학교 칩 */}
            <div>
              <span className="text-xs font-semibold text-[#6a6a6a] block mb-2">
                🔥 학생 인기 고등학교 바로 선택
              </span>
              <div className="flex flex-wrap gap-2">
                {SCHOOLS_DATA.map((school) => {
                  const isSelected = selectedSchool.id === school.id;
                  return (
                    <button
                      key={school.id}
                      onClick={() => setSelectedSchool(school)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-[#ff385c] text-white shadow-sm ring-2 ring-[#ff385c]/30"
                          : "bg-white text-[#6a6a6a] border border-[#dddddd] hover:border-[#222222]"
                      }`}
                    >
                      {school.shortName || school.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 학교 검색 리스트 */}
            <div className="max-h-64 overflow-y-auto space-y-2 border border-[#ebebeb] rounded-2xl p-2 bg-[#fcfcfc]">
              {filteredSchools.map((school) => {
                const isSelected = selectedSchool.id === school.id;
                return (
                  <button
                    key={school.id}
                    onClick={() => setSelectedSchool(school)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-[#fff0f3] border border-[#ffd1da]"
                        : "hover:bg-white border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isSelected
                            ? "bg-[#ff385c] text-white"
                            : "bg-[#f2f2f2] text-[#6a6a6a]"
                        }`}
                      >
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#222222]">
                          {school.name}
                        </div>
                        <div className="text-xs text-[#6a6a6a]">
                          {school.address}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[#ff385c] flex items-center justify-center text-white">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* STEP 2: 고등학생 취향 설문 */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <span className="text-xs font-bold text-[#ff385c] uppercase tracking-wider">
                STUDENT LIFESTYLE
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#222222] mt-1 tracking-tight">
                방과 후 주로 어디를 가시나요?
              </h1>
              <p className="text-sm text-[#6a6a6a] mt-2">
                나의 고교 라이프스타일에 맞는 스팟을 골라주세요 (다중 선택 가능)
              </p>
            </div>

            {/* 고등학생 특화 상황/목적 그리드 */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-[#222222] uppercase tracking-wide">
                상황 및 목적
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: "BUDGET" as PurposeCategory, label: "하교길 분식 · 가성비", desc: "떡볶이, 컵밥, 이삭토스트", icon: Wallet },
                  { id: "SOLO" as PurposeCategory, label: "야자 전 빠른 혼밥", desc: "학원 전 15분 컷 한끼", icon: Utensils },
                  { id: "STUDY_CAFE" as PurposeCategory, label: "시험기간 스카 · 독서실", desc: "자격증/내신 스터디카페", icon: Coffee },
                  { id: "GROUP" as PurposeCategory, label: "코노 · 친구랑 놀거리", desc: "시험 끝난 날 코인노래방, PC", icon: Mic2 },
                  { id: "NIGHT" as PurposeCategory, label: "24시 · 무인 야식", desc: "야자 후 한강라면, 편의점", icon: Moon },
                  { id: "CONVENIENCE" as PurposeCategory, label: "수행평가 인쇄 · 복사", desc: "긴급 프린트 복합기, 문구", icon: Printer },
                ].map((item) => {
                  const Icon = item.icon;
                  const isChecked = selectedPurposes.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => togglePurpose(item.id)}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        isChecked
                          ? "bg-[#fff0f3] border-[#ff385c] shadow-sm"
                          : "bg-white border-[#ebebeb] hover:border-[#dddddd]"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon
                          className={`w-5 h-5 ${
                            isChecked ? "text-[#ff385c]" : "text-[#6a6a6a]"
                          }`}
                        />
                        {isChecked && (
                          <div className="w-5 h-5 rounded-full bg-[#ff385c] flex items-center justify-center text-white">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="text-sm font-bold text-[#222222]">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-[#6a6a6a] mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 고교생 선호 간식 & 메뉴 */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-[#222222] uppercase tracking-wide">
                선호 메뉴
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "SNACK" as FoodCategory, label: "🍢 분식/떡볶이/토스트" },
                  { id: "KOREAN" as FoodCategory, label: "🍱 도시락/백반/찌개" },
                  { id: "JAPANESE" as FoodCategory, label: "🍣 돈까스/라멘" },
                  { id: "WESTERN" as FoodCategory, label: "🍔 햄버거/피자" },
                  { id: "CHINESE" as FoodCategory, label: "🥟 마라탕/짜장면" },
                  { id: "CAFE" as FoodCategory, label: "🥤 메가커피/에이드/와플" },
                ].map((cat) => {
                  const isChecked = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`px-3.5 py-2 rounded-full text-xs font-bold transition-all border ${
                        isChecked
                          ? "bg-[#222222] text-white border-[#222222]"
                          : "bg-white text-[#6a6a6a] border-[#dddddd] hover:border-[#222222]"
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 하단 고정 액션 바 */}
      <footer className="w-full border-t border-[#ebebeb] p-4 bg-white/95 backdrop-blur-md">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="px-4 py-3 text-sm font-semibold text-[#222222] hover:bg-[#f7f7f7] rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              이전
            </button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <button
              onClick={() => setStep(2)}
              className="flex-1 sm:flex-initial px-6 py-3 bg-[#ff385c] hover:bg-[#e00b41] active:bg-[#e00b41] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-airbnb transition-all"
            >
              <span>다음: 방과 후 취향 선택</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-8 py-3 bg-[#ff385c] hover:bg-[#e00b41] active:bg-[#e00b41] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-airbnb transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? "지도 구성 중..." : "학교 주변 지도 바로보기"}</span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
