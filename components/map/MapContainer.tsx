"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { Place } from "@/types";
import { Locate, RotateCcw, School as SchoolIcon } from "lucide-react";

export default function MapContainer() {
  const {
    activeSchool,
    places,
    activePlaceId,
    setActivePlaceId,
    setSelectedPlace,
  } = useAppStore();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const schoolMarkerRef = useRef<any>(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // 1. Leaflet 지도 동적 초기화
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      // Leaflet 동적 임포트
      const L = (await import("leaflet")).default;

      // 이미 인스턴스가 존재하면 삭제 후 재생성 방지
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }

      // 지도 생성 (CartoDB Positron: Airbnb 스타일에 완벽하게 어울리는 미니멀하고 세련된 타일)
      const map = L.map(mapContainerRef.current, {
        center: [activeSchool.lat, activeSchool.lng],
        zoom: 16,
        zoomControl: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
          subdomains: "abcd",
        }
      ).addTo(map);

      // 줌 컨트롤 우측 하단 배치
      L.control.zoom({ position: "bottomright" }).addTo(map);

      leafletMapRef.current = map;
      if (isMounted) setIsMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // 2. 학교 변경 시 지도 중심 이동 및 학교 랜드마크 마커 갱신
  useEffect(() => {
    if (!leafletMapRef.current || !isMapReady) return;

    const map = leafletMapRef.current;
    map.flyTo([activeSchool.lat, activeSchool.lng], 16, { duration: 1 });

    import("leaflet").then((LModule) => {
      const L = LModule.default;

      // 기존 학교 마커 제거
      if (schoolMarkerRef.current) {
        schoolMarkerRef.current.remove();
      }

      // 학교 대표 핀 (Airbnb Indigo & 랜드마크 스타일)
      const schoolIcon = L.divIcon({
        className: "custom-school-marker",
        html: `
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            background: #2E4057;
            color: #ffffff;
            padding: 6px 12px;
            border-radius: 9999px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
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
    });
  }, [activeSchool, isMapReady]);

  // 3. 장소 마커들 렌더링
  useEffect(() => {
    if (!leafletMapRef.current || !isMapReady) return;

    const map = leafletMapRef.current;

    import("leaflet").then((LModule) => {
      const L = LModule.default;

      // 기존 마커들 삭제
      Object.values(markersRef.current).forEach((marker: any) => marker.remove());
      markersRef.current = {};

      places.forEach((place: Place) => {
        const isSelected = activePlaceId === place.id;

        // 카테고리별 마커 컬러
        let pinColor = "#ff385c"; // 기본 맛집 (Rausch)
        let iconSymbol = "🍽️";

        if (place.primaryCategory === "STUDY_CAFE") {
          pinColor = "#8d5b4c";
          iconSymbol = "☕";
        } else if (place.primaryCategory === "NIGHT") {
          pinColor = "#1e88e5";
          iconSymbol = "🌙";
        } else if (place.primaryCategory === "BUDGET") {
          pinColor = "#008489";
          iconSymbol = "💰";
        } else if (place.primaryCategory === "GROUP") {
          pinColor = "#ff8f00";
          iconSymbol = "🍻";
        } else if (place.primaryCategory === "CONVENIENCE") {
          pinColor = "#5c6bc0";
          iconSymbol = "🧺";
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
                    ? "0 0 0 4px rgba(255, 56, 92, 0.3), 0 6px 16px rgba(0,0,0,0.3)"
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
                      box-shadow: 0 2px 6px rgba(0,0,0,0.2);
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
        }).addTo(map);

        marker.on("click", () => {
          setActivePlaceId(place.id);
          setSelectedPlace(place);
          map.panTo([place.lat, place.lng]);
        });

        markersRef.current[place.id] = marker;
      });
    });
  }, [places, activePlaceId, isMapReady]);

  // 4. 활성 장소 변경 시 해당 좌표로 panTo
  useEffect(() => {
    if (!leafletMapRef.current || !activePlaceId) return;
    const match = places.find((p) => p.id === activePlaceId);
    if (match) {
      leafletMapRef.current.panTo([match.lat, match.lng], {
        animate: true,
        duration: 0.5,
      });
    }
  }, [activePlaceId, places]);

  // 내 GPS 위치 가져오기
  const handleCurrentLocation = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation({ lat, lng });

          if (leafletMapRef.current) {
            leafletMapRef.current.flyTo([lat, lng], 17);

            import("leaflet").then((LModule) => {
              const L = LModule.default;
              L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: "#ff385c",
                color: "#ffffff",
                weight: 3,
                opacity: 1,
                fillOpacity: 1,
              }).addTo(leafletMapRef.current);
            });
          }
        },
        () => {
          alert("위치 정보를 가져올 수 없습니다. 브라우저 위치 권한을 확인해주세요.");
        }
      );
    }
  };

  // 학교 정문으로 지도 다시 맞추기
  const handleResetSchoolCenter = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([activeSchool.lat, activeSchool.lng], 16);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex-1 bg-[#f7f7f7] overflow-hidden">
      {/* 실제 지도 컨테이너 */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* 지도 플로팅 컨트롤 버튼 (Airbnb Floating Pill Buttons) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={handleResetSchoolCenter}
          className="flex items-center gap-1.5 px-3 py-2 bg-white text-[#222222] text-xs font-semibold rounded-full shadow-airbnb hover:shadow-airbnb-float border border-[#dddddd] transition-all active:scale-95 cursor-pointer"
          title="학교 중심으로 이동"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#ff385c]" />
          <span>학교 정문</span>
        </button>

        <button
          onClick={handleCurrentLocation}
          className="flex items-center gap-1.5 px-3 py-2 bg-white text-[#222222] text-xs font-semibold rounded-full shadow-airbnb hover:shadow-airbnb-float border border-[#dddddd] transition-all active:scale-95 cursor-pointer"
          title="내 현재 GPS 위치로 이동"
        >
          <Locate className="w-3.5 h-3.5 text-[#222222]" />
          <span>내 위치</span>
        </button>
      </div>

      {/* 장소 개수 플로팅 배지 */}
      <div className="absolute top-4 left-4 z-20">
        <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-airbnb border border-[#ebebeb] text-xs font-semibold text-[#222222] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#ff385c] animate-pulse"></span>
          <span>주변 추천 {places.length}곳</span>
        </div>
      </div>
    </div>
  );
}
