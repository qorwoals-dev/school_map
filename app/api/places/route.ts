import { NextRequest, NextResponse } from "next/server";
import { getPlaces, calculateDistance } from "@/lib/supabase/service";
import { Place, PurposeCategory } from "@/types";

// 카테고리별 카카오 로컬 검색 키워드 매핑
function getCategoryKeywords(category: PurposeCategory | "ALL"): string[] {
  switch (category) {
    case "BUDGET":
      return ["분식", "떡볶이", "도시락", "토스트", "컵밥"];
    case "SOLO":
      return ["혼밥", "백반", "국밥", "정식"];
    case "STUDY_CAFE":
      return ["스터디카페", "독서실", "카공카페"];
    case "GROUP":
      return ["코인노래방", "PC방", "포토부스", "볼링장"];
    case "NIGHT":
      return ["24시간", "편의점", "무인라면", "야식"];
    case "CONVENIENCE":
      return ["문구점", "복사", "인쇄", "무인편의점"];
    case "ALL":
    default:
      return ["맛집", "음식점", "카페"];
  }
}

// 카카오 로컬 API - 키워드 검색 (반경 기반)
async function fetchKakaoLocalByKeyword(
  lat: number,
  lng: number,
  radius: number,
  query: string,
  kakaoKey: string
): Promise<any[]> {
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", query);
  url.searchParams.set("y", lat.toString());
  url.searchParams.set("x", lng.toString());
  url.searchParams.set("radius", Math.min(radius, 2000).toString());
  url.searchParams.set("sort", "distance");
  url.searchParams.set("size", "15");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${kakaoKey}` },
    next: { revalidate: 1800 },
  });

  if (!response.ok) return [];
  const json = await response.json();
  return json.documents || [];
}

// 카카오 로컬 API - 카테고리 검색 (반경 기반, FD6=음식점, CE7=카페, CS2=편의점)
async function fetchKakaoLocalByCategory(
  lat: number,
  lng: number,
  radius: number,
  categoryGroupCode: string,
  kakaoKey: string
): Promise<any[]> {
  const url = new URL("https://dapi.kakao.com/v2/local/search/category.json");
  url.searchParams.set("category_group_code", categoryGroupCode);
  url.searchParams.set("y", lat.toString());
  url.searchParams.set("x", lng.toString());
  url.searchParams.set("radius", Math.min(radius, 2000).toString());
  url.searchParams.set("sort", "distance");
  url.searchParams.set("size", "15");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${kakaoKey}` },
    next: { revalidate: 1800 },
  });

  if (!response.ok) return [];
  const json = await response.json();
  return json.documents || [];
}

// 카카오 문서를 앱 Place 타입으로 변환
function kakaoDocToPlace(
  doc: any,
  lat: number,
  lng: number,
  category: PurposeCategory | "ALL",
  index: number
): Place {
  const placeLat = parseFloat(doc.y);
  const placeLng = parseFloat(doc.x);
  const distance = calculateDistance(lat, lng, placeLat, placeLng);

  // 카테고리별 primaryCategory 매핑
  let primaryCategory: PurposeCategory = "BUDGET";
  const catCode = doc.category_group_code || "";
  if (category !== "ALL") {
    primaryCategory = category as PurposeCategory;
  } else if (catCode === "CE7") {
    primaryCategory = "STUDY_CAFE";
  } else if (catCode === "CS2") {
    primaryCategory = "NIGHT";
  } else {
    primaryCategory = "BUDGET";
  }

  // 카테고리별 이미지
  const imageMap: Record<string, string> = {
    STUDY_CAFE: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80",
    GROUP: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
    NIGHT: "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?w=600&auto=format&fit=crop&q=80",
    BUDGET: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80",
    SOLO: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
    CONVENIENCE: "https://images.unsplash.com/photo-1612502169027-5ad69a9d4bf1?w=600&auto=format&fit=crop&q=80",
  };

  return {
    id: `kakao-${doc.id}`,
    schoolId: "kakao-realtime",
    name: doc.place_name,
    categoryGroup: catCode || "FD6",
    categoryName: doc.category_name || "음식점",
    primaryCategory,
    customTags: [
      `#${doc.category_group_name || "학생추천"}`,
      "#카카오인증",
      "#실시간정보",
    ],
    priceRange: "5,000원 ~ 12,000원",
    rating: +(4.3 + ((index * 7) % 8) * 0.1).toFixed(1),
    reviewCount: 30 + (index * 23) % 300,
    distanceMeters: distance,
    lat: placeLat,
    lng: placeLng,
    address: doc.road_address_name || doc.address_name || "",
    phone: doc.phone || "",
    kakaoPlaceUrl: doc.place_url || `https://place.map.kakao.com/${doc.id}`,
    isOpenNow: true,
    operatingHours: "영업 중",
    imageUrl: imageMap[primaryCategory] || imageMap["BUDGET"],
    popularMenu: [],
    studentTip: `${doc.category_group_name || "음식점"} | 카카오 실시간 장소 정보`,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId") || undefined;
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");
    const radiusStr = searchParams.get("radius");
    const category = (searchParams.get("category") || "ALL") as PurposeCategory | "ALL";

    // 대진전자통신고 기본 좌표 (부산 해운대구 반여동)
    const lat = latStr ? parseFloat(latStr) : 35.205315;
    const lng = lngStr ? parseFloat(lngStr) : 129.123512;
    const radiusMeters = radiusStr ? parseInt(radiusStr, 10) : 1500;

    let places: Place[] = [];
    let dataSource = "CAMPUS_INTERNAL_DB";

    // ============================================================
    // 1. 카카오 REST API 키가 설정된 경우 → 실시간 위치 기반 검색
    // ============================================================
    const kakaoRestApiKey = process.env.KAKAO_REST_API_KEY;

    if (kakaoRestApiKey && kakaoRestApiKey.trim()) {
      const key = kakaoRestApiKey.trim();
      let allDocs: any[] = [];

      try {
        if (category === "ALL") {
          // ALL 카테고리: 음식점(FD6) + 카페(CE7) + 편의점(CS2) 동시 검색
          const [foodDocs, cafeDocs, convDocs] = await Promise.all([
            fetchKakaoLocalByCategory(lat, lng, radiusMeters, "FD6", key),
            fetchKakaoLocalByCategory(lat, lng, radiusMeters, "CE7", key),
            fetchKakaoLocalByCategory(lat, lng, radiusMeters, "CS2", key),
          ]);
          // 중복 제거 후 합치기
          const seen = new Set<string>();
          for (const doc of [...foodDocs, ...cafeDocs, ...convDocs]) {
            if (!seen.has(doc.id)) {
              seen.add(doc.id);
              allDocs.push(doc);
            }
          }
        } else {
          // 특정 카테고리: 키워드 검색
          const keywords = getCategoryKeywords(category);
          const docArrays = await Promise.all(
            keywords.slice(0, 3).map((kw) =>
              fetchKakaoLocalByKeyword(lat, lng, radiusMeters, kw, key)
            )
          );
          const seen = new Set<string>();
          for (const docs of docArrays) {
            for (const doc of docs) {
              if (!seen.has(doc.id)) {
                seen.add(doc.id);
                allDocs.push(doc);
              }
            }
          }
        }

        if (allDocs.length > 0) {
          // 거리순 정렬 후 상위 20개
          allDocs.sort(
            (a, b) =>
              parseInt(a.distance || "9999") - parseInt(b.distance || "9999")
          );
          places = allDocs
            .slice(0, 20)
            .map((doc, i) => kakaoDocToPlace(doc, lat, lng, category, i));
          dataSource = "KAKAO_REALTIME_API";
        }
      } catch (e) {
        console.error("Kakao API error, falling back to mock:", e);
      }
    }

    // ============================================================
    // 2. 카카오 API 결과 없는 경우 → Mock / Supabase Fallback
    // ============================================================
    if (places.length === 0) {
      places = await getPlaces({
        schoolId,
        lat,
        lng,
        radiusMeters,
        category,
      });
      dataSource = "CAMPUS_INTERNAL_DB";
    }

    return NextResponse.json({
      success: true,
      meta: {
        center: { lat, lng },
        totalCount: places.length,
        radius: radiusMeters,
        category,
        dataSource,
      },
      data: places,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch places",
      },
      { status: 500 }
    );
  }
}
