"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GithubIcon } from "@/components/common/AuthButton";

export default function GithubLoginButton() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleLogin = async () => {
    const supabase = createClient();
    if (!supabase) {
      alert("로그인 설정이 아직 준비되지 않았습니다.");
      return;
    }
    setIsRedirecting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/map`,
      },
    });
    if (error) {
      setIsRedirecting(false);
      alert("GitHub 로그인을 시작하지 못했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={isRedirecting}
      className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-[#222222] text-white text-[15px] font-semibold hover:bg-black transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
    >
      <GithubIcon className="w-5 h-5" />
      {isRedirecting ? "GitHub로 이동 중..." : "GitHub로 계속하기"}
    </button>
  );
}
