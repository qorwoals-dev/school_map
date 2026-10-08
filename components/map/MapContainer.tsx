"use client";

import React, { useState } from "react";
import KakaoMap from "./KakaoMap";
import LeafletMap from "./LeafletMap";

// 카카오 지도를 우선 사용하고, SDK 로드에 실패하면 OpenStreetMap(Leaflet) 지도로 대체한다
export default function MapContainer() {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return <LeafletMap />;
  }
  return <KakaoMap onFail={() => setUseFallback(true)} />;
}
