import { Place } from "@/types";
import { createClient } from "./client";

const LOCAL_KEY = "user_bookmarks";

// 비로그인 사용자 즐겨찾기 (LocalStorage)
export function getLocalBookmarks(): Place[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]");
    // 예전 형식(장소 id 문자열 배열)은 장소 정보가 없어 버린다
    return Array.isArray(parsed) ? parsed.filter((p) => p && typeof p === "object" && p.id) : [];
  } catch {
    return [];
  }
}

export function setLocalBookmarks(places: Place[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(places));
}

// 로그인 사용자 즐겨찾기 (Supabase user_bookmarks 테이블)
export async function fetchRemoteBookmarks(): Promise<Place[]> {
  const supabase = createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("user_bookmarks")
    .select("place")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => row.place as Place);
}

export async function addRemoteBookmarks(userId: string, places: Place[]) {
  const supabase = createClient();
  if (!supabase || places.length === 0) return;
  const { error } = await supabase.from("user_bookmarks").upsert(
    places.map((place) => ({ user_id: userId, place_id: place.id, place })),
    { onConflict: "user_id,place_id", ignoreDuplicates: true }
  );
  if (error) throw error;
}

export async function removeRemoteBookmark(userId: string, placeId: string) {
  const supabase = createClient();
  if (!supabase) return;
  const { error } = await supabase
    .from("user_bookmarks")
    .delete()
    .eq("user_id", userId)
    .eq("place_id", placeId);
  if (error) throw error;
}
