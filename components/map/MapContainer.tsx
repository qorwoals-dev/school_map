"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { Place } from "@/types";
import { Locate, RotateCcw, Compass, MapPin } from "lucide-react";

export default function MapContainer() {
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

  const [isMapReady, setIsMapReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // 탐색 중심 좌표 계산 (현재 위치 모드이면 내 GPS, 아니면 학교 좌표)
  const centerLat = isCurrentLocationMode && currentLocation ? currentLocation.lat : activeSchool.lat;
  const centerLng = isCurrentLocationMode && currentLocation ? currentLocation.lng : activeSchool.lng;

  // 1. Leaflet 지도 초기화
  useEffect(() => {
    let isMounted = true;

    async function initLeaflet() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      const L = (await import("leaflet")).default;

      // 이미 초기화된 경우 정리
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      // 지도 컨테이너 생성
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Voyager / OSM 고화질 타일 레이어
      const tileLayer = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          subdomains: "abcd",
        }
      );

      // 타일 로드 에러 시 OpenStreetMap 기본 타일로 대체
      tileLayer.on("tileerror", () => {
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);
      });

      tileLayer.addTo(map);

      // 줌 컨트롤 우측 하단 배치
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // 마커 레이어 그룹 생성
      markersGroupRef.current = L.layerGroup().addTo(map);

      leafletMapRef.current = map;

      // Leaflet의 필수 사이즈 재계산 (타일 깨짐/회색 화면 방지)
      setTimeout(() => {
        if (isMounted && map) {
          map.invalidateSize();
          setIsMapReady(true);
        }
      }, 150);

      setTimeout(() => {
        if (isMounted && map) {
          map.invalidateSize();
        }
      }, 500);
    }

    initLeaflet();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // 2. 중심 좌표 또는 모드 변경 시 지도 중심 부드럽게 이동
  useEffect(() => {
    if (!leafletMapRef.current || !isMapReady) return;
    const map = leafletMapRef.current;

    map.flyTo([centerLat, centerLng], 16, { duration: 1 });
    setTimeout(() => map.invalidateSize(), 300);
  }, [centerLat, centerLng, isMapReady]);

  // 3. 학교 마커 & 내 현재 위치 마커 렌더링
  useEffect(() => {
    if (!leafletMapRef.current || !isMapReady) return;
    const map = leafletMapRef.current;

    import("leaflet").then((LModule) => {
      const L = LModule.default;

      // 기존 학교 마커 정리
      if (schoolMarkerRef.current) {
        schoolMarkerRef.current.remove();
      }

      // 학교 대표 랜드마크 마커
      const schoolIcon = L.divIcon({
        className: "custom-school-marker",
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #2E4057;
            color: #ffffff;
            padding: 6px 12px;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.3);
            border: 2px solid #ffffff;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
            transform: translate(-50%, -100%);
            cursor: pointer;
          ">
            <span>🏫</span>
            <span>${activeSchool.shortName || activeSchool.name}</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      schoolMarkerRef.current = L.marker([activeSchool.lat, activeSchool.lng], {
        icon: schoolIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      // 내 현재 GPS 위치가 활성화되어 있을 때 사용자 위치 핀 표시
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      if (currentLocation) {
        const userIcon = L.divIcon({
          className: "custom-user-marker",
          html: `
            <div style="position: relative; transform: translate(-50%, -50%);">
              <div style="
                width: 20px;
                height: 20px;
                border-radius: 9999px;
                background-color: #007aff;
                border: 3px solid #ffffff;
                box-shadow: 0 0 10px rgba(0,122,255,0.6);
              "></div>
              <div style="
                position: absolute;
                inset: -6px;
                border-radius: 9999px;
                background-color: rgba(0,122,255,0.25);
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>
            </div>
          `,
          iconSize: [0, 0],
        });

        userMarkerRef.current = L.marker([currentLocation.lat, currentLocation.lng], {
          icon: userIcon,
          zIndexOffset: 1200,
        }).addTo(map);
      }
    });
  }, [activeSchool, currentLocation, isMapReady]);

  // 4. 주변 장소 마커들 렌더링
  useEffect(() => {
    if (!leafletMapRef.current || !isMapReady || !markersGroupRef.current) return;
    const map = leafletMapRef.current;

    import("leaflet").then((LModule) => {
      const L = LModule.default;
      markersGroupRef.current.clearLayers();

      places.forEach((place: Place) => {
        const isSelected = activePlaceId === place.id;

        // 고등학생 카테고리별 마커 컬러 및 아이콘
        let pinColor = "#ff385c"; // 기본 맛집 (Rausch)
        let iconSymbol = "🍢";

        if (place.primaryCategory === "STUDY_CAFE") {
          pinColor = "#6d4c41";
          iconSymbol = "📖";
        } else if (place.primaryCategory === "NIGHT") {
          pinColor = "#1e88e5";
          iconSymbol = "🌙";
        } else if (place.primaryCategory === "BUDGET") {
          pinColor = "#008489";
          iconSymbol = "🍱";
        } else if (place.primaryCategory === "GROUP") {
          pinColor = "#e65100";
          iconSymbol = "🎤";
        } else if (place.primaryCategory === "CONVENIENCE") {
          pinColor = "#5c6bc0";
          iconSymbol = "🖨️";
        }

        const customIcon = L.divIcon({
          className: "custom-place-marker",
          html: `
            <div style="
              position: relative;
              cursor: pointer;
              transform: translate(-50%, -50%);
              transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            ">
              <div style="
                width: ${isSelected ? "44px" : "36px"};
                height: ${isSelected ? "44px" : "36px"};
                border-radius: 9999px;
                background-color: ${pinColor};
                color: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${isSelected ? "18px" : "15px"};
                box-shadow: ${
                  isSelected
                    ? "0 0 0 4px rgba(255, 56, 92, 0.35), 0 6px 18px rgba(0,0,0,0.3)"
                    : "0 2px 8px rgba(0,0,0,0.2)"
                };
                border: 2px solid #ffffff;
              ">
                ${iconSymbol}
              </div>
              ${
                isSelected
                  ? `<div style="
                      position: absolute;
                      bottom: -22px;
                      left: 50%;
                      transform: translateX(-50%);
                      background: #222222;
                      color: #ffffff;
                      font-size: 11px;
                      font-weight: 700;
                      padding: 2px 8px;
                      border-radius: 6px;
                      white-space: nowrap;
                      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
                      border: 1px solid rgba(255,255,255,0.2);
                    ">${place.name}</div>`
                  : ""
              }
            </div>
          `,
          iconSize: [0, 0],
        });

        const marker = L.marker([place.lat, place.lng], {
          icon: customIcon,
          zIndexOffset: isSelected ? 500 : 100,
        });

        marker.on("click", () => {
          setActivePlaceId(place.id);
          setSelectedPlace(place);
          map.panTo([place.lat, place.lng], { animate: true, duration: 0.5 });
        });

        markersGroupRef.current.addLayer(marker);
      });
    });
  }, [places, activePlaceId, isMapReady]);

  // 5. 사용자의 실제 브라우저 위치(GPS) 가져오기 & 위치 기반 탐색 실행
  const handleGetLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      alert("현재 브라우저에서 위치 정보를 지원하지 않습니다.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const loc = { lat, lng, label: "내 현재 위치" };
        setCurrentLocation(loc);
        setIsCurrentLocationMode(true);
        setIsLocating(false);

        if (leafletMapRef.current) {
          leafletMapRef.current.flyTo([lat, lng], 16, { duration: 1.2 });
          setTimeout(() => leafletMapRef.current?.invalidateSize(), 300);
        }
      },
      (err) => {
        setIsLocating(false);
        alert(
          "위치 접근 권한이 차단되어 있습니다. 브라우저 주소창 좌측 자물쇠 아이콘에서 위치 권한을 '허용'해주세요!"
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [setCurrentLocation, setIsCurrentLocationMode]);

  // 학교 중심으로 돌아가기
  const handleResetToSchool = () => {
    setIsCurrentLocationMode(false);
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([activeSchool.lat, activeSchool.lng], 16, { duration: 1 });
      setTimeout(() => leafletMapRef.current?.invalidateSize(), 300);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-[#f2f2f2] overflow-hidden">
      {/* 실제 Leaflet 지도 캔버스 */}
      <div
        ref={mapContainerRef}
        id="campus-spot-map"
        className="absolute inset-0 w-full h-full z-10"
        style={{ width: "100%", height: "100%", minHeight: "100%" }}
      />

      {/* 상단 좌측: 현재 탐색 기준 칩 배지 */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-airbnb border border-[#ebebeb] text-xs font-bold text-[#222222] flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full animate-pulse ${
              isCurrentLocationMode ? "bg-[#007aff]" : "bg-[#ff385c]"
            }`}
          />
          <span>
            {isCurrentLocationMode ? "📍 내 현재 위치 기준 탐색" : `🏫 ${activeSchool.shortName || activeSchool.name}`}
          </span>
          <span className="text-[#6a6a6a] font-normal">({places.length}곳)</span>
        </div>
      </div>

      {/* 상단 우측: 플로팅 컨트롤 (학교 정문 vs 내 위치 스위치) */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col gap-2">
        {/* 학교 정문 복귀 버튼 */}
        <button
          onClick={handleResetToSchool}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-full shadow-airbnb hover:shadow-airbnb-float border transition-all active:scale-95 cursor-pointer ${
            !isCurrentLocationMode
              ? "bg-[#222222] text-white border-[#222222]"
              : "bg-white text-[#222222] border-[#dddddd] hover:border-[#222222]"
          }`}
          title="학교 정문 중심으로 이동"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${!isCurrentLocationMode ? "text-[#ff385c]" : "text-[#ff385c]"}`} />
          <span>학교 정문</span>
        </button>

        {/* 내 실제 GPS 위치 버튼 */}
        <button
          onClick={handleGetLocation}
          disabled={isLocating}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-full shadow-airbnb hover:shadow-airbnb-float border transition-all active:scale-95 cursor-pointer ${
            isCurrentLocationMode
              ? "bg-[#007aff] text-white border-[#007aff]"
              : "bg-white text-[#222222] border-[#dddddd] hover:border-[#007aff]"
          }`}
          title="내 현재 GPS 위치로 지도 이동 및 주변 맛집 검색"
        >
          <Locate className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : isCurrentLocationMode ? "text-white" : "text-[#007aff]"}`} />
          <span>{isLocating ? "위치 찾는 중..." : "내 주변 탐색"}</span>
        </button>
      </div>
    </div>
  );
}
