"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { Place } from "@/types";
import { Locate, RotateCcw } from "lucide-react";

declare global {
  interface Window {
    kakao: any;
  }
}

// 카카오 SDK 를 불러오지 못하면 onFail 을 호출해 대체 지도로 전환한다
export default function KakaoMap({ onFail }: { onFail: () => void }) {
  const {
    activeSchool,
    places,
    activePlaceId,
    setActivePlaceId,
    setSelectedPlace,
    isCurrentLocationMode,
    setIsCurrentLocationMode,
    currentLocation,
    setCurrentLocation,
  } = useAppStore();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const kakaoMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const overlaysRef = useRef<any[]>([]);
  const schoolMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const centerLat = isCurrentLocationMode && currentLocation ? currentLocation.lat : activeSchool.lat;
  const centerLng = isCurrentLocationMode && currentLocation ? currentLocation.lng : activeSchool.lng;

  // ─── 1. 카카오 지도 초기화 ──────────────────────────────────────────────────
  useEffect(() => {
    let loaded = false;

    function initMap() {
      if (loaded) return;
      if (!mapContainerRef.current) return;
      if (!window.kakao || !window.kakao.maps) return;
      loaded = true;

      window.kakao.maps.load(() => {
        const center = new window.kakao.maps.LatLng(centerLat, centerLng);
        const map = new window.kakao.maps.Map(mapContainerRef.current, {
          center,
          level: 4,
        });
        kakaoMapRef.current = map;
        setIsMapReady(true);
      });
    }

    // 카카오 SDK가 이미 로드된 경우 즉시 초기화
    if (window.kakao && window.kakao.maps) {
      initMap();
    } else {
      // 스크립트 로드 대기 (최대 6초). 도메인 미등록 등으로 SDK 가 401 을 받으면 window.kakao 가 생기지 않는다
      let tries = 0;
      const poll = setInterval(() => {
        tries++;
        if (window.kakao && window.kakao.maps) {
          clearInterval(poll);
          initMap();
        } else if (tries > 60) {
          clearInterval(poll);
          console.warn(
            "[KakaoMap] 카카오 지도 SDK 로드 실패. 카카오 개발자 콘솔의 Web 플랫폼 도메인 등록을 확인하세요. 기본 지도로 전환합니다."
          );
          onFail();
        }
      }, 100);
      return () => clearInterval(poll);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 2. 중심 좌표 변경 시 지도 이동 ──────────────────────────────────────────
  useEffect(() => {
    if (!kakaoMapRef.current || !isMapReady) return;
    const center = new window.kakao.maps.LatLng(centerLat, centerLng);
    kakaoMapRef.current.panTo(center);
  }, [centerLat, centerLng, isMapReady]);

  // ─── 3. 학교 마커 & 내 위치 마커 ─────────────────────────────────────────────
  useEffect(() => {
    if (!kakaoMapRef.current || !isMapReady) return;
    const map = kakaoMapRef.current;
    const K = window.kakao.maps;

    // 기존 학교 마커 제거
    if (schoolMarkerRef.current) {
      schoolMarkerRef.current.setMap(null);
      schoolMarkerRef.current = null;
    }

    // 학교 커스텀 오버레이
    const schoolContent = `
      <div style="
        display:inline-flex;align-items:center;gap:5px;
        background:#1a2e44;color:#fff;
        padding:6px 13px;border-radius:9999px;
        box-shadow:0 3px 12px rgba(0,0,0,0.35);
        border:2px solid #fff;font-size:12px;font-weight:700;
        white-space:nowrap;cursor:default;
        font-family:-apple-system,sans-serif;
        transform:translate(-50%,-130%);
      ">🏫 ${activeSchool.shortName || activeSchool.name}</div>
    `;
    schoolMarkerRef.current = new K.CustomOverlay({
      position: new K.LatLng(activeSchool.lat, activeSchool.lng),
      content: schoolContent,
      xAnchor: 0,
      yAnchor: 0,
    });
    schoolMarkerRef.current.setMap(map);

    // 내 위치 마커
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
    if (currentLocation) {
      const userContent = `
        <div style="position:relative;transform:translate(-50%,-50%);">
          <div style="
            width:18px;height:18px;border-radius:50%;
            background:#007aff;border:3px solid #fff;
            box-shadow:0 0 0 8px rgba(0,122,255,0.2);
          "></div>
        </div>
      `;
      userMarkerRef.current = new K.CustomOverlay({
        position: new K.LatLng(currentLocation.lat, currentLocation.lng),
        content: userContent,
        xAnchor: 0,
        yAnchor: 0,
      });
      userMarkerRef.current.setMap(map);
    }
  }, [activeSchool, currentLocation, isMapReady]);

  // ─── 4. 장소 마커 렌더링 ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!kakaoMapRef.current || !isMapReady) return;
    const map = kakaoMapRef.current;
    const K = window.kakao.maps;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    overlaysRef.current.forEach((o) => o.setMap(null));
    markersRef.current = [];
    overlaysRef.current = [];

    const colorMap: Record<string, { bg: string; emoji: string }> = {
      STUDY_CAFE:  { bg: "#6d4c41", emoji: "📖" },
      NIGHT:       { bg: "#1e88e5", emoji: "🌙" },
      BUDGET:      { bg: "#ff385c", emoji: "🍱" },
      GROUP:       { bg: "#e65100", emoji: "🎤" },
      CONVENIENCE: { bg: "#5c6bc0", emoji: "🖨️" },
      SOLO:        { bg: "#008489", emoji: "🍜" },
    };

    places.forEach((place: Place) => {
      const isSelected = activePlaceId === place.id;
      const { bg = "#ff385c", emoji = "🍽️" } = colorMap[place.primaryCategory] || {};
      const size = isSelected ? 46 : 36;

      const content = `
        <div
          id="marker-${place.id}"
          style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:${bg};color:#fff;
            display:flex;align-items:center;justify-content:center;
            font-size:${isSelected ? 20 : 15}px;
            box-shadow:${isSelected
              ? "0 0 0 5px rgba(255,56,92,0.25),0 6px 16px rgba(0,0,0,0.3)"
              : "0 2px 8px rgba(0,0,0,0.2)"};
            border:2.5px solid #fff;
            cursor:pointer;
            transform:translate(-50%,-50%);
            transition:all 0.15s;
            user-select:none;
          "
        >${emoji}</div>
        ${isSelected ? `
          <div style="
            position:absolute;bottom:-26px;left:50%;transform:translateX(-50%);
            background:#111;color:#fff;font-size:11px;font-weight:700;
            padding:3px 8px;border-radius:6px;white-space:nowrap;
            box-shadow:0 2px 6px rgba(0,0,0,0.2);pointer-events:none;
          ">${place.name}</div>
        ` : ""}
      `;

      const overlay = new K.CustomOverlay({
        position: new K.LatLng(place.lat, place.lng),
        content,
        xAnchor: 0,
        yAnchor: 0,
        zIndex: isSelected ? 5 : 3,
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);

      // 클릭 이벤트는 DOM에 직접 바인딩
      setTimeout(() => {
        const el = document.getElementById(`marker-${place.id}`);
        if (el) {
          el.onclick = () => {
            setActivePlaceId(place.id);
            setSelectedPlace(place);
            map.panTo(new K.LatLng(place.lat, place.lng));
          };
        }
      }, 50);
    });
  }, [places, activePlaceId, isMapReady, setActivePlaceId, setSelectedPlace]);

  // ─── 5. GPS 현재 위치 ──────────────────────────────────────────────────────
  const handleGetLocation = useCallback(() => {
    if (!navigator?.geolocation) {
      alert("위치 정보를 지원하지 않는 브라우저입니다.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLocation({ lat, lng });
        setIsCurrentLocationMode(true);
        setIsLocating(false);
        if (kakaoMapRef.current) {
          kakaoMapRef.current.panTo(new window.kakao.maps.LatLng(lat, lng));
        }
      },
      () => {
        setIsLocating(false);
        alert("위치 권한이 차단되어 있습니다. 브라우저에서 위치 권한을 허용해주세요.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setCurrentLocation, setIsCurrentLocationMode]);

  // ─── 6. 학교 중심 복귀 ───────────────────────────────────────────────────
  const handleResetToSchool = useCallback(() => {
    setIsCurrentLocationMode(false);
    if (kakaoMapRef.current) {
      kakaoMapRef.current.panTo(
        new window.kakao.maps.LatLng(activeSchool.lat, activeSchool.lng)
      );
    }
  }, [activeSchool, setIsCurrentLocationMode]);

  return (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      {/* 카카오 지도 컨테이너 */}
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      {/* 로딩 오버레이 (지도 초기화 전) */}
      {!isMapReady && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 9999,
          background: "#e8eef2",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "3px solid #ddd", borderTop: "3px solid #ff385c",
            animation: "spin 0.7s linear infinite",
          }} />
          <span style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>
            카카오 지도 불러오는 중...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* 상단 좌측 배지 */}
      {isMapReady && (
        <div style={{
          position: "absolute", top: 12, left: 12, zIndex: 100,
        }}>
          <div style={{
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(12px)",
            padding: "6px 14px", borderRadius: 9999,
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
            border: "1px solid #ebebeb",
            fontSize: 12, fontWeight: 700, color: "#222",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: "50%",
              background: isCurrentLocationMode ? "#007aff" : "#ff385c",
              display: "inline-block",
            }} />
            {isCurrentLocationMode
              ? "📍 내 현재 위치 기준"
              : `🏫 ${activeSchool.shortName || activeSchool.name}`}
            <span style={{ color: "#999", fontWeight: 400 }}>
              ({places.length}곳)
            </span>
          </div>
        </div>
      )}

      {/* 상단 우측 컨트롤 */}
      {isMapReady && (
        <div style={{
          position: "absolute", top: 12, right: 12, zIndex: 100,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <button
            onClick={handleResetToSchool}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 13px", fontSize: 11, fontWeight: 700,
              borderRadius: 9999, cursor: "pointer",
              border: `1.5px solid ${!isCurrentLocationMode ? "#222" : "#ddd"}`,
              background: !isCurrentLocationMode ? "#222" : "#fff",
              color: !isCurrentLocationMode ? "#fff" : "#222",
              boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
            }}
          >
            <RotateCcw style={{ width: 13, height: 13, color: "#ff385c" }} />
            학교 정문
          </button>
          <button
            onClick={handleGetLocation}
            disabled={isLocating}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 13px", fontSize: 11, fontWeight: 700,
              borderRadius: 9999, cursor: "pointer",
              border: `1.5px solid ${isCurrentLocationMode ? "#007aff" : "#ddd"}`,
              background: isCurrentLocationMode ? "#007aff" : "#fff",
              color: isCurrentLocationMode ? "#fff" : "#222",
              boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
              opacity: isLocating ? 0.7 : 1,
            }}
          >
            <Locate style={{ width: 13, height: 13, color: isCurrentLocationMode ? "#fff" : "#007aff" }} />
            {isLocating ? "위치 찾는 중..." : "내 주변 탐색"}
          </button>
        </div>
      )}
    </div>
  );
}
