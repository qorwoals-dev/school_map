-- ==========================================
-- [Campus Spot] Supabase Database Schema
-- ==========================================

-- 1. 학교 테이블 (전국 대학교/고등학교)
CREATE TABLE IF NOT EXISTS public.schools (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  campus_type TEXT NOT NULL CHECK (campus_type IN ('UNIVERSITY', 'HIGH_SCHOOL')),
  address TEXT NOT NULL,
  region TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 공간 쿼리 및 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_schools_name ON public.schools (name);
CREATE INDEX IF NOT EXISTS idx_schools_lat_lng ON public.schools (lat, lng);

-- 2. 사용자 프로필 & 온보딩 선호도
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT, -- Supabase Auth 또는 익명 클라이언트 ID
  school_id TEXT REFERENCES public.schools(id) ON DELETE SET NULL,
  purposes TEXT[] DEFAULT '{}',     -- ['SOLO', 'BUDGET', 'STUDY_CAFE']
  food_categories TEXT[] DEFAULT '{}', -- ['KOREAN', 'JAPANESE', 'CAFE']
  radius_meters INTEGER DEFAULT 1000,
  location_mode TEXT DEFAULT 'SCHOOL_CENTER',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles (user_id);

-- 3. 장소 (맛집 & 편의시설) 테이블
CREATE TABLE IF NOT EXISTS public.places (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_group TEXT NOT NULL,
  category_name TEXT NOT NULL,
  primary_category TEXT NOT NULL, -- SOLO, BUDGET, STUDY_CAFE, NIGHT 등
  food_type TEXT,                 -- KOREAN, WESTERN 등
  custom_tags TEXT[] DEFAULT '{}',
  price_range TEXT,
  rating NUMERIC(2,1) DEFAULT 4.5,
  review_count INTEGER DEFAULT 0,
  distance_meters INTEGER DEFAULT 0,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  kakao_place_url TEXT,
  naver_place_url TEXT,
  is_open_now BOOLEAN DEFAULT true,
  operating_hours TEXT,
  image_url TEXT,
  popular_menu TEXT[] DEFAULT '{}',
  student_tip TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_places_school ON public.places (school_id);
CREATE INDEX IF NOT EXISTS idx_places_primary_category ON public.places (primary_category);
CREATE INDEX IF NOT EXISTS idx_places_lat_lng ON public.places (lat, lng);

-- 4. 즐겨찾기 / 찜 (Bookmarks)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  place_id TEXT REFERENCES public.places(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, place_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks (user_id);

-- 5. 학생 리뷰 & 팁 (Reviews)
CREATE TABLE IF NOT EXISTS public.place_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id TEXT REFERENCES public.places(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_place_id ON public.place_reviews (place_id);

-- Row Level Security (RLS) 활성화
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.place_reviews ENABLE ROW LEVEL SECURITY;

-- 누구나 학교와 장소를 읽을 수 있도록 정책 설정
CREATE POLICY "Public read for schools" ON public.schools FOR SELECT USING (true);
CREATE POLICY "Public read for places" ON public.places FOR SELECT USING (true);
CREATE POLICY "Public read for reviews" ON public.place_reviews FOR SELECT USING (true);
CREATE POLICY "Public insert for reviews" ON public.place_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "User bookmark control" ON public.bookmarks FOR ALL USING (true);
CREATE POLICY "User profile control" ON public.user_profiles FOR ALL USING (true);

-- 6. 로그인 사용자 즐겨찾기 (migrations/001_user_bookmarks.sql 참고)
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
