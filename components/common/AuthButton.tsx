"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-1.96c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

export default function AuthButton() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogin = async () => {
    if (!supabase) return;
    const next = window.location.pathname + window.location.search;
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  };

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  // Supabase 환경 변수가 없으면 로그인 버튼을 숨긴다
  if (!supabase) return null;

  if (isLoading) {
    return <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#f2f2f2] animate-pulse" />;
  }

  if (!user) {
    return (
      <button
        onClick={handleLogin}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#222222] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
        title="GitHub 계정으로 로그인"
      >
        <GithubIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">로그인</span>
      </button>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const userName =
    (user.user_metadata?.user_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email;

  return (
    <button
      onClick={handleLogout}
      className="group relative w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-[#dddddd] overflow-hidden flex items-center justify-center bg-[#f7f7f7] cursor-pointer"
      title={`${userName} · 클릭하여 로그아웃`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={userName ?? "프로필"} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-[#222222]">{userName?.[0]?.toUpperCase()}</span>
      )}
      <span className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-black/50 text-white">
        <LogOut className="w-3.5 h-3.5" />
      </span>
    </button>
  );
}
