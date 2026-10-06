import { Place, PurposeCategory, School, UserCampusPreferences } from "@/types";
import { SCHOOLS_DATA } from "@/lib/data/schools";
import { MOCK_PLACES } from "@/lib/data/mockPlaces";
import { createClient } from "./client";

// 하버사인 공식(Haversine formula)으로 두 좌표 사이의 거리(미터) 계산
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // 지구 반경 (미터)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// 1. 학교 검색 (자동완성)
export async function getSchools(keyword?: string): Promise<School[]> {
  const supabase = createClient();

  if (supabase) {
    try {
      let query = supabase.from("schools").select("*");
      if (keyword && keyword.trim()) {
        query = query.ilike("name", `%${keyword.trim()}%`);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          id: item.id,
          name: item.name,
          shortName: item.short_name,
          campusType: item.campus_type,
          address: item.address,
          lat: item.lat,
          lng: item.lng,
          region: item.region,
        }));
      }
    } catch {
      // fallback to local mock
    }
  }

  // Fallback: 내장 데이터에서 검색
  if (!keyword || !keyword.trim()) {
    return SCHOOLS_DATA;
  }
  const lower = keyword.trim().toLowerCase();
  return SCHOOLS_DATA.filter(
    (s) =>
      s.name.toLowerCase().includes(lower) ||
      (s.shortName && s.shortName.toLowerCase().includes(lower)) ||
      s.region.toLowerCase().includes(lower)
  );
}

// 2. 장소 목록 조회 (학교 / 중심좌표 / 카테고리 필터)
export async function getPlaces(params: {
  schoolId?: string;
  lat: number;
  lng: number;
  radiusMeters?: number;
  category?: PurposeCategory | "ALL";
}): Promise<Place[]> {
  const { schoolId, lat, lng, radiusMeters = 1500, category = "ALL" } = params;
  const supabase = createClient();

  let places: Place[] = [];

  if (supabase) {
    try {
      let query = supabase.from("places").select("*");
      if (schoolId) {
        query = query.eq("school_id", schoolId);
      }
      if (category !== "ALL") {
        query = query.eq("primary_category", category);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        places = data.map((item: any) => ({
          id: item.id,
          schoolId: item.school_id,
          name: item.name,
          categoryGroup: item.category_group,
          categoryName: item.category_name,
          primaryCategory: item.primary_category,
          foodType: item.food_type,
          customTags: item.custom_tags || [],
          priceRange: item.price_range,
          rating: Number(item.rating),
          reviewCount: item.review_count,
          distanceMeters: calculateDistance(lat, lng, item.lat, item.lng),
          lat: item.lat,
          lng: item.lng,
          address: item.address,
          phone: item.phone,
          kakaoPlaceUrl: item.kakao_place_url,
          naverPlaceUrl: item.naver_place_url,
          isOpenNow: item.is_open_now,
          operatingHours: item.operating_hours,
          imageUrl: item.image_url,
          popularMenu: item.popular_menu || [],
          studentTip: item.student_tip,
        }));
      }
    } catch {
      // fallback
    }
  }

  // Fallback: MOCK_PLACES 활용
  if (places.length === 0) {
    let pool = MOCK_PLACES;
    if (schoolId) {
      const matchSchool = pool.filter((p) => p.schoolId === schoolId);
      // 만약 해당 학교 데이터가 아직 없다면 대표 데이터셋의 좌표를 중심 기준 상대거리로 시뮬레이션
      if (matchSchool.length > 0) {
        pool = matchSchool;
      } else {
        // 다른 학교일 경우 중심 좌표 기준 가상 배치
        pool = MOCK_PLACES.map((p, idx) => ({
          ...p,
          id: `sim-${schoolId}-${p.id}`,
          schoolId,
          lat: lat + (Math.sin(idx * 1.3) * 0.003),
          lng: lng + (Math.cos(idx * 1.3) * 0.0035),
        }));
      }
    }

    if (category !== "ALL") {
      pool = pool.filter((p) => p.primaryCategory === category);
    }

    places = pool.map((p) => ({
      ...p,
      distanceMeters: calculateDistance(lat, lng, p.lat, p.lng),
    }));
  }

  // 반경 필터 및 거리순 정렬
  return places
    .filter((p) => p.distanceMeters <= radiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

// 3. 사용자 선호도 저장 (Supabase + LocalStorage 연계)
export async function saveUserPreferences(prefs: UserCampusPreferences): Promise<boolean> {
  if (typeof window !== "undefined") {
    localStorage.setItem("user_campus_prefs", JSON.stringify(prefs));
  }

  const supabase = createClient();
  if (supabase) {
    try {
      await supabase.from("user_profiles").upsert({
        school_id: prefs.school.id,
        purposes: prefs.preferences.purposes,
        food_categories: prefs.preferences.categories,
        radius_meters: prefs.radiusMeters,
        location_mode: prefs.locationMode,
        updated_at: new Date().toISOString(),
      });
      return true;
    } catch (e) {
      console.warn("Supabase upsert failed, stored in LocalStorage fallback:", e);
    }
  }

  return true;
}

// 4. 로컬 스토리지 선호도 조회
export function getStoredPreferences(): UserCampusPreferences | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user_campus_prefs");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
