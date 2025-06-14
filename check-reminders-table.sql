-- リマインダーテーブルの存在確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'reminders';

-- remindersテーブルの構造確認（存在する場合）
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'reminders'
ORDER BY ordinal_position;

-- リマインダーテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックスを作成
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_at ON public.reminders(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_reminders_sent ON public.reminders(sent);

-- RLSポリシーを設定
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のリマインダーのみアクセス可能
CREATE POLICY IF NOT EXISTS "Users can manage their own reminders" 
ON public.reminders 
FOR ALL 
USING (auth.uid() = user_id);

-- 権限を付与
GRANT ALL ON public.reminders TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;