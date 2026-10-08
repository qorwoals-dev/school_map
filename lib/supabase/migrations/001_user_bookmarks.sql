-- 로그인 사용자 즐겨찾기 (카카오 로컬 API 장소는 places 테이블에 없으므로 장소 정보를 jsonb 스냅샷으로 저장)
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  place JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, place_id)
);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_created
  ON public.user_bookmarks (user_id, created_at DESC);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

-- 본인 즐겨찾기만 조회/추가/삭제 가능
CREATE POLICY "Users read own bookmarks" ON public.user_bookmarks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own bookmarks" ON public.user_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own bookmarks" ON public.user_bookmarks
  FOR DELETE USING (auth.uid() = user_id);
