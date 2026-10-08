import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// GitHub OAuth 인증 후 Supabase 가 리다이렉트하는 콜백
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/map";
  // 오픈 리다이렉트 방지: 내부 경로만 허용
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/map";
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
