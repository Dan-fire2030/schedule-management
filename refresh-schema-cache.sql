-- Supabaseのスキーマキャッシュ問題を解決
-- Supabase SQL Editorで実行してください

-- 1. 現在のeventsテーブルの完全な構造を確認
SELECT 
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'events'
ORDER BY ordinal_position;

-- 2. end_dateカラムの存在確認
SELECT 
  column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'events'
  AND column_name = 'end_date';

-- 3. end_dateカラムを追加（存在しない場合）
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 4. eventsテーブルを一度ドロップして再作成（最終手段）
-- 注意: これはデータが失われるので、データがある場合は実行しないでください
-- DROP TABLE IF EXISTS public.events CASCADE;

-- 5. eventsテーブルを完全に再作成（必要な場合のみ）
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('single', 'all_day', 'recurring', 'task')),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- 日時設定
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    is_all_day BOOLEAN NOT NULL DEFAULT false,
    timezone TEXT DEFAULT 'Asia/Tokyo',
    
    -- 繰り返し設定（JSONB形式）
    recurrence_rule JSONB,
    
    -- 場所情報（JSONB形式）
    location JSONB,
    
    -- 参加者管理
    max_participants INTEGER,
    allow_maybe BOOLEAN NOT NULL DEFAULT true,
    require_response BOOLEAN NOT NULL DEFAULT false,
    
    -- 作成者・管理
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. スキーマキャッシュをリフレッシュする方法
-- Supabaseダッシュボードで以下を実行:
-- a) Project Settings → API → "Reload schema cache" ボタンをクリック
-- または
-- b) Database → Tables → eventsテーブルを選択 → 何か小さな変更を加えて保存（コメント追加など）

-- 7. テスト用のINSERT文（グループIDは実際のものに置き換えてください）
/*
INSERT INTO public.events (
    group_id,
    title,
    description,
    type,
    start_date,
    end_date,
    start_time,
    end_time,
    is_all_day,
    allow_maybe,
    require_response,
    created_by
) VALUES (
    'your-actual-group-id-here',  -- 実際のグループIDに置き換え
    'テストイベント',
    'スキーマキャッシュテスト用',
    'single',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 day',
    '14:00',
    '16:00',
    false,
    true,
    false,
    auth.uid()
);
*/

-- 8. 作成されたイベントを確認
SELECT 
    id,
    title,
    start_date,
    end_date,
    created_at
FROM events 
ORDER BY created_at DESC 
LIMIT 1;