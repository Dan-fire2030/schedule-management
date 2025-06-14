-- Events テーブルに不足しているカラムを追加
-- Supabase SQL Editorで実行してください

-- 1. 現在のeventsテーブルの構造を確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'events'
ORDER BY ordinal_position;

-- 2. 不足しているカラムを追加

-- allow_maybe カラム（未定での回答を許可するか）
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS allow_maybe BOOLEAN NOT NULL DEFAULT true;

-- require_response カラム（回答を必須にするか）
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS require_response BOOLEAN NOT NULL DEFAULT false;

-- max_participants カラム（最大参加者数）
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS max_participants INTEGER;

-- location カラム（場所情報をJSONBで保存）
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS location JSONB;

-- recurrence_rule カラム（繰り返し設定をJSONBで保存）
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS recurrence_rule JSONB;

-- timezone カラム（タイムゾーン情報）
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Tokyo';

-- 3. 制約条件の追加・確認

-- type カラムの制約を確認・更新
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_type_check;

ALTER TABLE public.events 
ADD CONSTRAINT events_type_check 
CHECK (type IN ('single', 'all_day', 'recurring', 'task'));

-- status カラムの制約を確認・更新
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_status_check;

ALTER TABLE public.events 
ADD CONSTRAINT events_status_check 
CHECK (status IN ('draft', 'published', 'cancelled', 'completed'));

-- priority カラムの制約を確認・更新
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_priority_check;

ALTER TABLE public.events 
ADD CONSTRAINT events_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- 4. インデックスの追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);
CREATE INDEX IF NOT EXISTS idx_events_priority ON public.events(priority);

-- 5. 更新後のテーブル構造を確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'events'
ORDER BY ordinal_position;

-- 6. 制約条件の確認
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  cc.check_clause
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.check_constraints AS cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'events'
  AND tc.table_schema = 'public'
  AND tc.constraint_type IN ('CHECK', 'PRIMARY KEY', 'FOREIGN KEY');

-- 7. event_participants テーブルも確認・作成
CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('attending', 'not_attending', 'pending')),
    response_message TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 同じイベントに同じユーザーは1回のみ参加登録可能
    UNIQUE(event_id, user_id)
);

-- event_participants のインデックス
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON public.event_participants(status);

-- 8. 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'Events テーブルのカラム追加が完了しました。';
    RAISE NOTICE '追加されたカラム:';
    RAISE NOTICE '- allow_maybe: BOOLEAN (デフォルト: true)';
    RAISE NOTICE '- require_response: BOOLEAN (デフォルト: false)';
    RAISE NOTICE '- max_participants: INTEGER';
    RAISE NOTICE '- location: JSONB';
    RAISE NOTICE '- recurrence_rule: JSONB';
    RAISE NOTICE '- timezone: TEXT (デフォルト: Asia/Tokyo)';
END $$;