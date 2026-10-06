"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass } from "lucide-react";
import { getStoredPreferences } from "@/lib/supabase/service";

export default function RootPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // 온보딩 완료 여부 확인
    const prefs = getStoredPreferences();
    if (prefs && prefs.school) {
      router.replace("/map");
    } else {
      router.replace("/onboarding");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-4 animate-pulse">
        <div className="w-16 h-16 rounded-full bg-[#ff385c] flex items-center justify-center text-white shadow-airbnb-float">
          <Compass className="w-8 h-8 stroke-[2.2] animate-spin" style={{ animationDuration: "3s" }} />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#222222] tracking-tight">
            캠퍼스<span className="text-[#ff385c]">스팟</span>
          </h1>
          <p className="text-xs text-[#6a6a6a] mt-1 font-medium">
            학교 주변 맛집 & 편의시설 지도를 준비하는 중...
          </p>
        </div>
      </div>
    </div>
  );
}
