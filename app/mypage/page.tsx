import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import MyPageClient from "./MyPageClient";

export default async function MyPage() {
  const supabase = await createServerSupabaseClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  // 로그인하지 않은 사용자는 로그인 페이지로
  if (!user) {
    redirect("/login");
  }

  return <MyPageClient user={user} />;
}
