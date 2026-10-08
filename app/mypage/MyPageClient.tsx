"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, Heart, LogOut, MapPin, School as SchoolIcon, SlidersHorizontal, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";
import { GithubIcon, getProfile } from "@/components/common/AuthButton";
import { FoodCategory, Place, PurposeCategory, UserCampusPreferences } from "@/types";

const PURPOSE_LABELS: Record<PurposeCategory, string> = {
  BUDGET: "하교길 분식 · 가성비",
  SOLO: "야자 전 혼밥",
  STUDY_CAFE: "시험기간 스카 · 독서실",
  GROUP: "코노 · 친구랑 놀거리",
  NIGHT: "24시 · 무인 야식",
  CONVENIENCE: "수행평가 인쇄 · 편의",
};

const FOOD_LABELS: Record<FoodCategory, string> = {
  SNACK: "🍢 분식",
  KOREAN: "🍱 한식",
  JAPANESE: "🍣 일식",
  WESTERN: "🍔 양식",
  CHINESE: "🥟 중식",
  CAFE: "🥤 카페",
};

// 온보딩에서 저장한 선호도 (LocalStorage) 를 구독한다
const PREFS_KEY = "user_campus_prefs";
function subscribePrefs(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function MyPageClient({ user }: { user: User }) {
  const router = useRouter();
  const bookmarks = useAppStore((s) => s.bookmarks);
  const toggleBookmark = useAppStore((s) => s.toggleBookmark);
  const setSelectedPlace = useAppStore((s) => s.setSelectedPlace);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const rawPrefs = useSyncExternalStore(
    subscribePrefs,
    () => localStorage.getItem(PREFS_KEY),
    () => null
  );
  const prefs = useMemo<UserCampusPreferences | null>(() => {
    if (!rawPrefs) return null;
    try {
      return JSON.parse(rawPrefs);
    } catch {
      return null;
    }
  }, [rawPrefs]);

  const { avatarUrl, displayName, githubUsername } = getProfile(user);
  const joinedAt = new Date(user.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleLogout = async () => {
    setIsSigningOut(true);
    await createClient()?.auth.signOut();
    router.replace("/map");
    router.refresh();
  };

  const handleOpenPlace = (place: Place) => {
    setSelectedPlace(place);
    router.push("/map");
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] selection:bg-[#ffd1da] selection:text-[#ff385c]">
      {/* 상단 바 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#ebebeb]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            href="/map"
            className="w-9 h-9 rounded-full hover:bg-[#f2f2f2] flex items-center justify-center text-[#222222] transition-colors"
            title="지도로 돌아가기"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-base font-bold text-[#222222]">내 정보</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
        {/* 프로필 카드 */}
        <section className="bg-white rounded-2xl border border-[#ebebeb] p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[#f2f2f2] flex items-center justify-center flex-shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-[#222222]">{displayName[0]?.toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-[#222222] truncate">{displayName}</p>
            {githubUsername && (
              <a
                href={`https://github.com/${githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#6a6a6a] hover:text-[#222222] mt-0.5"
              >
                <GithubIcon className="w-3 h-3" />@{githubUsername}
              </a>
            )}
            {user.email && <p className="text-xs text-[#6a6a6a] truncate mt-0.5">{user.email}</p>}
            <p className="text-[11px] text-[#929292] mt-1">{joinedAt} 가입</p>
          </div>
        </section>

        {/* 나의 탐색 설정 */}
        <section className="bg-white rounded-2xl border border-[#ebebeb] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#222222]">나의 탐색 설정</h2>
            <Link
              href="/onboarding"
              className="flex items-center gap-1 text-xs font-semibold text-[#ff385c] hover:underline"
            >
              <SlidersHorizontal className="w-3 h-3" />
              다시 설정
            </Link>
          </div>
          {prefs ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-[#222222]">
                <SchoolIcon className="w-4 h-4 text-[#6a6a6a]" />
                <span className="font-semibold">{prefs.school.name}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {prefs.preferences.purposes.map((p) => (
                  <span key={p} className="px-2.5 py-1 rounded-full bg-[#fff0f3] text-[#ff385c] text-xs font-semibold">
                    {PURPOSE_LABELS[p] ?? p}
                  </span>
                ))}
                {prefs.preferences.categories.map((c) => (
                  <span key={c} className="px-2.5 py-1 rounded-full bg-[#f2f2f2] text-[#222222] text-xs font-semibold">
                    {FOOD_LABELS[c] ?? c}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#6a6a6a]">아직 설정한 취향이 없어요. 온보딩에서 학교와 취향을 골라보세요.</p>
          )}
        </section>

        {/* 즐겨찾기 */}
        <section id="bookmarks" className="bg-white rounded-2xl border border-[#ebebeb] p-5 scroll-mt-20">
          <h2 className="text-sm font-bold text-[#222222] mb-3 flex items-center gap-1.5">
            <Heart className="w-4 h-4 fill-[#ff385c] text-[#ff385c]" />
            즐겨찾기
            <span className="text-[#6a6a6a] font-semibold">{bookmarks.length}</span>
          </h2>
          {bookmarks.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[#6a6a6a]">아직 찜한 장소가 없어요.</p>
              <Link href="/map" className="inline-block mt-3 text-xs font-semibold text-[#ff385c] hover:underline">
                지도에서 장소 둘러보기 →
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-[#f0f0f0]">
              {bookmarks.map((place) => (
                <li key={place.id} className="py-3 flex items-center gap-3">
                  <button
                    onClick={() => handleOpenPlace(place)}
                    className="flex-1 min-w-0 text-left cursor-pointer group"
                  >
                    <p className="text-sm font-bold text-[#222222] truncate group-hover:underline">{place.name}</p>
                    <p className="text-xs text-[#6a6a6a] truncate mt-0.5">{place.categoryName}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#929292]">
                      {place.rating > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-[#222222] text-[#222222]" />
                          {place.rating.toFixed(1)}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {place.address}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => toggleBookmark(place)}
                    className="w-9 h-9 rounded-full hover:bg-[#fff0f3] flex items-center justify-center flex-shrink-0 cursor-pointer"
                    title="즐겨찾기 해제"
                  >
                    <Heart className="w-4 h-4 fill-[#ff385c] text-[#ff385c]" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <button
          onClick={handleLogout}
          disabled={isSigningOut}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-[#dddddd] bg-white text-sm font-semibold text-[#222222] hover:bg-[#f2f2f2] transition-colors cursor-pointer disabled:opacity-60"
        >
          <LogOut className="w-4 h-4" />
          {isSigningOut ? "로그아웃 중..." : "로그아웃"}
        </button>
      </main>
    </div>
  );
}
