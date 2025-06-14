-- 🚀 QUICK FIX: event_participantsテーブル作成
-- このファイルをSupabase SQL Editorにコピー&ペーストして実行してください

-- Step 1: テーブル作成
CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'attending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(event_id, user_id)
);

-- Step 2: インデックス作成
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);

-- Step 3: 権限付与
GRANT ALL ON public.event_participants TO authenticated;

-- 完了！
-- この後、イベント作成時に参加者エラーが出なくなります。