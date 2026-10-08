"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/lib/store/useAppStore";

// 로그인 상태를 전역 스토어에 동기화하고, 사용자가 바뀌면 즐겨찾기를 다시 불러온다
export default function AuthSync() {
  const setAuthUser = useAppStore((s) => s.setAuthUser);
  const loadBookmarks = useAppStore((s) => s.loadBookmarks);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setAuthUser(null);
      loadBookmarks();
      return;
    }

    let lastUserId: string | null | undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      if (user?.id !== lastUserId) {
        lastUserId = user?.id ?? null;
        // onAuthStateChange 콜백 안에서 Supabase 호출을 await 하면 교착될 수 있어 다음 틱으로 미룬다
        setTimeout(() => loadBookmarks(), 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [setAuthUser, loadBookmarks]);

  return null;
}
