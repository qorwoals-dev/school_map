import { redirect } from "next/navigation";
import { Compass } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import GithubLoginButton from "./GithubLoginButton";

export default async function LoginPage() {
  // 이미 로그인된 사용자는 바로 지도로 보낸다
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      redirect("/map");
    }
  }

  return (
    <main className="min-h-screen bg-[#ffffff] flex items-center justify-center px-6 selection:bg-[#ffd1da] selection:text-[#ff385c]">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-[#ff385c] flex items-center justify-center text-white shadow-sm mb-5">
          <Compass className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#222222]">
          스쿨<span className="text-[#ff385c]">스팟</span> 시작하기
        </h1>
        <p className="mt-2 text-sm text-[#6a6a6a] leading-relaxed">
          로그인하고 우리 학교 주변 맛집과 스팟을 찜해보세요.
        </p>

        <div className="w-full mt-8">
          <GithubLoginButton />
        </div>

        <p className="mt-6 text-[11px] text-[#929292]">
          로그인하면 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다.
        </p>
      </div>
    </main>
  );
}
