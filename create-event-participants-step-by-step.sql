-- Step 1: テーブルの存在確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'event_participants';

-- Step 2: event_participantsテーブルを作成（存在しない場合）
CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('attending', 'not_attending', 'maybe')),
    response_message TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 同じイベントに同じユーザーは一度だけ参加可能
    UNIQUE(event_id, user_id)
);

-- Step 3: インデックスを作成
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON public.event_participants(status);

-- Step 4: RLSを有効化
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Step 5: 基本的な権限を付与
GRANT ALL ON public.event_participants TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 6以降: ポリシーを個別に作成（必要に応じて手動で実行）

-- 既存のポリシーを確認
-- SELECT policyname FROM pg_policies WHERE tablename = 'event_participants';

-- 既存のポリシーを削除（必要に応じて）
-- DROP POLICY IF EXISTS "Users can view event participants in their groups" ON public.event_participants;
-- DROP POLICY IF EXISTS "Users can manage their own participation" ON public.event_participants;

-- 新しいポリシーを作成
/*
CREATE POLICY "Users can view event participants in their groups" 
ON public.event_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.group_members gm ON e.group_id = gm.group_id
    WHERE e.id = event_participants.event_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their own participation" 
ON public.event_participants 
FOR ALL 
USING (auth.uid() = user_id);
*/