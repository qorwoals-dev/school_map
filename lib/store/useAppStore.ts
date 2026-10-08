import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { Place, PurposeCategory, School, UserCampusPreferences } from "@/types";
import { SCHOOLS_DATA } from "@/lib/data/schools";
import {
  addRemoteBookmarks,
  fetchRemoteBookmarks,
  getLocalBookmarks,
  removeRemoteBookmark,
  setLocalBookmarks,
} from "@/lib/supabase/bookmarks";

interface AppState {
  // 온보딩 / 선호도
  preferences: UserCampusPreferences | null;
  activeSchool: School;
  setPreferences: (prefs: UserCampusPreferences) => void;
  setActiveSchool: (school: School) => void;

  // 장소 데이터 & 지도 인터랙션
  places: Place[];
  setPlaces: (places: Place[]) => void;
  isLoadingPlaces: boolean;
  setIsLoadingPlaces: (loading: boolean) => void;

  // 활성 탭 & 마커
  activeCategory: PurposeCategory | "ALL";
  setActiveCategory: (cat: PurposeCategory | "ALL") => void;

  activePlaceId: string | null;
  setActivePlaceId: (id: string | null) => void;

  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;

  // 뷰 모드 (지도 vs 목록)
  viewMode: "MAP" | "LIST";
  setViewMode: (mode: "MAP" | "LIST") => void;

  // 모달 제어
  isSchoolModalOpen: boolean;
  setIsSchoolModalOpen: (open: boolean) => void;

  // 위치 모드 (학교 중심 vs 내 현재 GPS 위치)
  isCurrentLocationMode: boolean;
  setIsCurrentLocationMode: (mode: boolean) => void;
  currentLocation: { lat: number; lng: number; label?: string } | null;
  setCurrentLocation: (loc: { lat: number; lng: number; label?: string } | null) => void;

  // 로그인 사용자
  authUser: User | null;
  isAuthLoading: boolean;
  setAuthUser: (user: User | null) => void;

  // 북마크 (찜) - 로그인 시 Supabase, 비로그인 시 LocalStorage
  bookmarks: Place[];
  loadBookmarks: () => Promise<void>;
  toggleBookmark: (place: Place) => Promise<void>;
  isBookmarked: (placeId: string) => boolean;
}

export const useAppStore = create<AppState>((set, get) => ({
  preferences: null,
  activeSchool: SCHOOLS_DATA[0], // 건국대 기본
  setPreferences: (prefs) =>
    set({
      preferences: prefs,
      activeSchool: prefs.school,
    }),
  setActiveSchool: (school) => set({ activeSchool: school }),

  places: [],
  setPlaces: (places) => set({ places }),
  isLoadingPlaces: false,
  setIsLoadingPlaces: (isLoadingPlaces) => set({ isLoadingPlaces }),

  activeCategory: "ALL",
  setActiveCategory: (activeCategory) => set({ activeCategory }),

  activePlaceId: null,
  setActivePlaceId: (id) => {
    set({ activePlaceId: id });
    if (id) {
      const match = get().places.find((p) => p.id === id);
      if (match) set({ selectedPlace: match });
    }
  },

  selectedPlace: null,
  setSelectedPlace: (place) =>
    set({
      selectedPlace: place,
      activePlaceId: place ? place.id : null,
    }),

  viewMode: "MAP",
  setViewMode: (viewMode) => set({ viewMode }),

  isSchoolModalOpen: false,
  setIsSchoolModalOpen: (isSchoolModalOpen) => set({ isSchoolModalOpen }),

  isCurrentLocationMode: false,
  setIsCurrentLocationMode: (isCurrentLocationMode) => set({ isCurrentLocationMode }),

  currentLocation: null,
  setCurrentLocation: (currentLocation) => set({ currentLocation }),

  authUser: null,
  isAuthLoading: true,
  setAuthUser: (authUser) => set({ authUser, isAuthLoading: false }),

  bookmarks: [],
  loadBookmarks: async () => {
    const user = get().authUser;
    if (!user) {
      set({ bookmarks: getLocalBookmarks() });
      return;
    }
    try {
      // 비로그인 상태에서 찜한 장소가 있으면 계정으로 옮긴다
      const local = getLocalBookmarks();
      if (local.length > 0) {
        await addRemoteBookmarks(user.id, local);
        setLocalBookmarks([]);
      }
      set({ bookmarks: await fetchRemoteBookmarks() });
    } catch (e) {
      console.warn("즐겨찾기를 불러오지 못했습니다:", e);
    }
  },
  toggleBookmark: async (place: Place) => {
    const user = get().authUser;
    const prev = get().bookmarks;
    const exists = prev.some((p) => p.id === place.id);
    const next = exists ? prev.filter((p) => p.id !== place.id) : [place, ...prev];
    set({ bookmarks: next });

    if (!user) {
      setLocalBookmarks(next);
      return;
    }
    try {
      if (exists) {
        await removeRemoteBookmark(user.id, place.id);
      } else {
        await addRemoteBookmarks(user.id, [place]);
      }
    } catch (e) {
      console.warn("즐겨찾기 저장에 실패했습니다:", e);
      set({ bookmarks: prev });
      alert("즐겨찾기 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  },
  isBookmarked: (placeId: string) => get().bookmarks.some((p) => p.id === placeId),
}));
