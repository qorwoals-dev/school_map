"use client";

import React from "react";
import { useAppStore } from "@/lib/store/useAppStore";
import { PurposeCategory } from "@/types";
import { Sparkles, Utensils, Coffee, Moon, Mic2, Wallet, Printer } from "lucide-react";

interface FilterItem {
  id: PurposeCategory | "ALL";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FILTERS: FilterItem[] = [
  { id: "ALL", label: "전체 스팟", icon: Sparkles },
  { id: "BUDGET", label: "하교길 분식 · 가성비", icon: Wallet },
  { id: "SOLO", label: "야자 전 혼밥", icon: Utensils },
  { id: "STUDY_CAFE", label: "시험기간 스카 · 독서실", icon: Coffee },
  { id: "GROUP", label: "코노 · 친구랑 놀거리", icon: Mic2 },
  { id: "NIGHT", label: "24시 · 무인 야식", icon: Moon },
  { id: "CONVENIENCE", label: "수행평가 인쇄 · 편의", icon: Printer },
];

export default function FilterBar() {
  const { activeCategory, setActiveCategory } = useAppStore();

  return (
    <div className="w-full bg-white border-b border-[#ebebeb] px-4 py-2 z-30 sticky top-[61px]">
      <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {FILTERS.map((item) => {
          const Icon = item.icon;
          const isActive = activeCategory === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveCategory(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 border ${
                isActive
                  ? "bg-[#222222] text-white border-[#222222] shadow-sm"
                  : "bg-white text-[#6a6a6a] border-[#dddddd] hover:border-[#222222] hover:text-[#222222]"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? "text-white" : "text-[#6a6a6a]"
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
