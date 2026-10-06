import { create } from "zustand";
import { Place, PurposeCategory, School, UserCampusPreferences } from "@/types";
import { SCHOOLS_DATA } from "@/lib/data/schools";

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

  // 북마크 (찜)
  bookmarks: string[];
  toggleBookmark: (placeId: string) => void;
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

  bookmarks: [],
  toggleBookmark: (placeId: string) => {
    const current = get().bookmarks;
    let next: string[];
    if (current.includes(placeId)) {
      next = current.filter((id) => id !== placeId);
    } else {
      next = [...current, placeId];
    }
    set({ bookmarks: next });
    if (typeof window !== "undefined") {
      localStorage.setItem("user_bookmarks", JSON.stringify(next));
    }
  },
  isBookmarked: (placeId: string) => get().bookmarks.includes(placeId),
}));
