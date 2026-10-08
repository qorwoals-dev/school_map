"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { Place } from "@/types";
import { Locate, RotateCcw } from "lucide-react";

export default function LeafletMap() {
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
  const leafletMapRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const schoolMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const initAttemptedRef = useRef(false);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const centerLat = isCurrentLocationMode && currentLocation ? currentLocation.lat : activeSchool.lat;
  const centerLng = isCurrentLocationMode && currentLocation ? currentLocation.lng : activeSchool.lng;

  // ─── 1. Leaflet 지도 초기화 (한 번만) ───────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    if (initAttemptedRef.current) return;
    initAttemptedRef.current = true;

    async function initLeaflet() {
      if (typeof window === "undefined") return;

      // DOM이 준비될 때까지 대기
      const waitForDOM = () =>
        new Promise<void>((resolve) => {
          const check = () => {
            if (mapContainerRef.current && mapContainerRef.current.offsetWidth > 0) {
              resolve();
            } else {
              requestAnimationFrame(check);
            }
          };
          check();
        });

      await waitForDOM();
      if (!isMounted || !mapContainerRef.current) return;

      // 이미 초기화된 Leaflet 인스턴스 제거
      if ((mapContainerRef.current as any)._leaflet_id) {
        return;
      }

      const L = (await import("leaflet")).default;
      leafletRef.current = L;

      // 기본 아이콘 경로 수정 (Next.js에서 Leaflet 아이콘 깨짐 방지)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current!, {
        center: [centerLat, centerLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: true,
      });

      // OpenStreetMap 타일 (한국 지도 고화질)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // 줌 컨트롤 우측 하단
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // 마커 레이어 그룹
      markersGroupRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;

      // 렌더 사이즈 보정
      map.whenReady(() => {
        setTimeout(() => {
          if (isMounted) {
            map.invalidateSize();
            setIsMapReady(true);
          }
        }, 100);
      });

      // 추가 보정
      setTimeout(() => {
        if (isMounted && map) map.invalidateSize();
      }, 500);
      setTimeout(() => {
        if (isMounted && map) map.invalidateSize();
      }, 1000);
    }

    initLeaflet();

    return () => {
      isMounted = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 컴포넌트 언마운트 시 지도 제거 ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        initAttemptedRef.current = false;
      }
    };
  }, []);

  // ─── 2. 중심 좌표 변경 시 지도 이동 ──────────────────────────────────────────
  useEffect(() => {
    if (!leafletMapRef.current || !isMapReady) return;
    leafletMapRef.current.flyTo([centerLat, centerLng], 16, { duration: 0.8 });
  }, [centerLat, centerLng, isMapReady]);

  // ─── 3. 학교 마커 & 내 위치 마커 ─────────────────────────────────────────────
  useEffect(() => {
    if (!leafletMapRef.current || !isMapReady || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = leafletMapRef.current;

    // 기존 학교 마커 제거
    if (schoolMarkerRef.current) {
      schoolMarkerRef.current.remove();
      schoolMarkerRef.current = null;
    }

    const schoolIcon = L.divIcon({
      className: "",
      html: `
        <div style="
          display:inline-flex;align-items:center;gap:5px;
          background:#1a2e44;color:#fff;
          padding:5px 11px;border-radius:9999px;
          box-shadow:0 3px 12px rgba(0,0,0,0.35);
          border:2px solid #fff;font-size:11px;font-weight:700;
          white-space:nowrap;transform:translate(-50%,-100%);
          font-family:'Pretendard',-apple-system,sans-serif;
          pointer-events:none;
        ">
          <span>🏫</span>
          <span>${activeSchool.shortName || activeSchool.name}</span>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    schoolMarkerRef.current = L.marker([activeSchool.lat, activeSchool.lng], {
      icon: schoolIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    // 내 위치 마커
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (currentLocation) {
      const userIcon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;transform:translate(-50%,-50%);">
            <div style="
              width:18px;height:18px;border-radius:50%;
              background:#007aff;border:3px solid #fff;
              box-shadow:0 0 10px rgba(0,122,255,0.5);
            "></div>
            <div style="
              position:absolute;inset:-8px;border-radius:50%;
              background:rgba(0,122,255,0.2);
              animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;
            "></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      userMarkerRef.current = L.marker([currentLocation.lat, currentLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1200,
      }).addTo(map);
    }
  }, [activeSchool, currentLocation, isMapReady]);

  // ─── 4. 장소 마커들 렌더링 ───────────────────────────────────────────────────
  useEffect(() => {
    if (!leafletMapRef.current || !isMapReady || !markersGroupRef.current || !leafletRef.current) return;
    const L = leafletRef.current;
    const map = leafletMapRef.current;

    markersGroupRef.current.clearLayers();

    places.forEach((place: Place) => {
      const isSelected = activePlaceId === place.id;

      const colorMap: Record<string, { bg: string; emoji: string }> = {
        STUDY_CAFE: { bg: "#6d4c41", emoji: "📖" },
        NIGHT:     { bg: "#1e88e5", emoji: "🌙" },
        BUDGET:    { bg: "#ff385c", emoji: "🍱" },
        GROUP:     { bg: "#e65100", emoji: "🎤" },
        CONVENIENCE: { bg: "#5c6bc0", emoji: "🖨️" },
        SOLO:      { bg: "#008489", emoji: "🍜" },
      };
      const { bg = "#ff385c", emoji = "🍽️" } =
        colorMap[place.primaryCategory] || {};

      const size = isSelected ? 46 : 36;
      const fontSize = isSelected ? 19 : 15;
      const shadow = isSelected
        ? `0 0 0 4px rgba(255,56,92,0.3), 0 6px 16px rgba(0,0,0,0.25)`
        : `0 2px 8px rgba(0,0,0,0.2)`;

      const customIcon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;cursor:pointer;transform:translate(-50%,-50%);">
            <div style="
              width:${size}px;height:${size}px;border-radius:50%;
              background:${bg};color:#fff;
              display:flex;align-items:center;justify-content:center;
              font-size:${fontSize}px;
              box-shadow:${shadow};
              border:2.5px solid #fff;
              transition:all 0.2s cubic-bezier(0.175,0.885,0.32,1.275);
            ">${emoji}</div>
            ${isSelected ? `
              <div style="
                position:absolute;bottom:-22px;left:50%;
                transform:translateX(-50%);
                background:#111;color:#fff;
                font-size:10px;font-weight:700;
                padding:2px 7px;border-radius:5px;
                white-space:nowrap;
                box-shadow:0 2px 6px rgba(0,0,0,0.2);
                font-family:'Pretendard',-apple-system,sans-serif;
                pointer-events:none;
              ">${place.name}</div>
            ` : ""}
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([place.lat, place.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 500 : 100,
      });

      marker.on("click", () => {
        setActivePlaceId(place.id);
        setSelectedPlace(place);
        map.panTo([place.lat, place.lng], { animate: true, duration: 0.4 });
      });

      markersGroupRef.current.addLayer(marker);
    });
  }, [places, activePlaceId, isMapReady, setActivePlaceId, setSelectedPlace]);

  // ─── 5. GPS 실제 위치 가져오기 ───────────────────────────────────────────────
  const handleGetLocation = useCallback(() => {
    if (!navigator?.geolocation) {
      alert("현재 브라우저에서 위치 정보를 지원하지 않습니다.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCurrentLocation({ lat, lng, label: "내 현재 위치" });
        setIsCurrentLocationMode(true);
        setIsLocating(false);

        if (leafletMapRef.current) {
          leafletMapRef.current.flyTo([lat, lng], 16, { duration: 1.0 });
        }
      },
      () => {
        setIsLocating(false);
        alert("위치 접근 권한이 차단되어 있습니다. 브라우저 주소창에서 위치 권한을 '허용'해주세요.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setCurrentLocation, setIsCurrentLocationMode]);

  // ─── 6. 학교 중심으로 복귀 ──────────────────────────────────────────────────
  const handleResetToSchool = useCallback(() => {
    setIsCurrentLocationMode(false);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([activeSchool.lat, activeSchool.lng], 16, { duration: 0.8 });
    }
  }, [activeSchool, setIsCurrentLocationMode]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Leaflet 지도 캔버스 */}
      <div
        ref={mapContainerRef}
        id="campus-spot-map"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 10,
          background: "#e8eef2",
        }}
      />

      {/* 로딩 오버레이 */}
      {!isMapReady && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            background: "#e8eef2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid #ebebeb",
              borderTop: "3px solid #ff385c",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <span style={{ fontSize: 13, color: "#6a6a6a", fontWeight: 600 }}>
            지도 불러오는 중...
          </span>
        </div>
      )}

      {/* 상단 좌측: 탐색 기준 배지 */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(12px)",
            padding: "6px 14px",
            borderRadius: 9999,
            boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
            border: "1px solid #ebebeb",
            fontSize: 12,
            fontWeight: 700,
            color: "#222",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: isCurrentLocationMode ? "#007aff" : "#ff385c",
              display: "inline-block",
              animation: "ping-soft 1.5s ease-in-out infinite",
            }}
          />
          <span>
            {isCurrentLocationMode
              ? "📍 내 현재 위치 기준"
              : `🏫 ${activeSchool.shortName || activeSchool.name}`}
          </span>
          <span style={{ color: "#888", fontWeight: 400 }}>
            ({places.length}곳)
          </span>
        </div>
      </div>

      {/* 상단 우측: 컨트롤 버튼 */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <button
          onClick={handleResetToSchool}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "7px 13px",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 9999,
            cursor: "pointer",
            border: `1.5px solid ${!isCurrentLocationMode ? "#222" : "#ddd"}`,
            background: !isCurrentLocationMode ? "#222" : "#fff",
            color: !isCurrentLocationMode ? "#fff" : "#222",
            boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
            transition: "all 0.2s",
          }}
        >
          <RotateCcw style={{ width: 13, height: 13, color: "#ff385c" }} />
          <span>학교 정문</span>
        </button>

        <button
          onClick={handleGetLocation}
          disabled={isLocating}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "7px 13px",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 9999,
            cursor: isLocating ? "default" : "pointer",
            border: `1.5px solid ${isCurrentLocationMode ? "#007aff" : "#ddd"}`,
            background: isCurrentLocationMode ? "#007aff" : "#fff",
            color: isCurrentLocationMode ? "#fff" : "#222",
            boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
            transition: "all 0.2s",
            opacity: isLocating ? 0.7 : 1,
          }}
        >
          <Locate
            style={{
              width: 13,
              height: 13,
              color: isCurrentLocationMode ? "#fff" : "#007aff",
              animation: isLocating ? "spin 1s linear infinite" : "none",
            }}
          />
          <span>{isLocating ? "위치 찾는 중..." : "내 주변 탐색"}</span>
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ping-soft {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
        @keyframes ping {
          0% { transform: scale(0.8); opacity: 0.8; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .leaflet-container {
          font-family: 'Pretendard', -apple-system, sans-serif !important;
        }
        .leaflet-attribution-flag {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
