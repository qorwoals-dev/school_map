export type CampusType = "UNIVERSITY" | "HIGH_SCHOOL";

export interface School {
  id: string;
  name: string;
  shortName?: string;
  campusType: CampusType;
  address: string;
  lat: number;
  lng: number;
  region: string; // e.g. "서울 광진구", "서울 마포구"
}

export type PurposeCategory =
  | "SOLO"         // 혼밥 친화
  | "BUDGET"       // 가성비 (1만원 이하)
  | "STUDY_CAFE"   // 카공/콘센트/와이파이
  | "GROUP"        // 단체 모임/회식
  | "NIGHT"        // 24시/야식
  | "CONVENIENCE"; // 편의/빨래방/스터디룸

export type FoodCategory =
  | "KOREAN"   // 한식/백반/찌개
  | "WESTERN"  // 양식/버거/피자
  | "JAPANESE" // 일식/돈카츠/라멘
  | "CHINESE"  // 중식/마라탕
  | "SNACK"    // 분식/포장
  | "CAFE";    // 카페/디저트

export interface UserCampusPreferences {
  version: "1.0";
  school: School;
  preferences: {
    purposes: PurposeCategory[];
    categories: FoodCategory[];
  };
  locationMode: "SCHOOL_CENTER" | "CURRENT_GEO";
  radiusMeters: number; // e.g., 500, 1000, 1500
  lastUpdated: string;
}

export interface PlaceReview {
  id: string;
  placeId: string;
  authorName: string;
  rating: number;
  content: string;
  tags: string[];
  createdAt: string;
}

export interface Place {
  id: string;
  schoolId: string;
  name: string;
  categoryGroup: string;       // e.g. "FD6" (음식점), "CE7" (카페), "CS2" (편의점)
  categoryName: string;        // "음식점 > 한식 > 찌개,백반"
  primaryCategory: PurposeCategory;
  foodType?: FoodCategory;
  customTags: string[];        // ["#혼밥친화", "#가성비최고", "#학생할인", "#콘센트완비"]
  priceRange: string;          // "7,000원 ~ 9,000원"
  rating: number;              // 4.8
  reviewCount: number;         // 124
  distanceMeters: number;      // 학교 정문 기준 거리 (m)
  lat: number;
  lng: number;
  address: string;
  phone: string;
  kakaoPlaceUrl: string;
  naverPlaceUrl?: string;
  isOpenNow: boolean;
  operatingHours: string;      // "10:30 ~ 21:30 (일요일 휴무)"
  imageUrl: string;            // 대표 이미지 URL
  popularMenu?: string[];      // ["제육볶음 정식", "순두부찌개"]
  studentTip?: string;         // "공기밥 무한리필, 점심 12시엔 웨이팅 있음"
}

export interface Bookmark {
  id: string;
  placeId: string;
  createdAt: string;
}
