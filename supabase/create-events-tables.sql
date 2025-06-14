-- イベント・予定管理機能のためのテーブル作成
-- 実行前に既存のテーブルを確認し、必要に応じてバックアップを取ってください

-- 1. eventsテーブル（イベント情報）
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

-- 2. event_participantsテーブル（イベント参加者）
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

-- 3. event_remindersテーブル（イベントリマインダー）
CREATE TABLE IF NOT EXISTS public.event_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    minutes_before INTEGER NOT NULL, -- 何分前に通知するか
    method TEXT NOT NULL DEFAULT 'notification' CHECK (method IN ('notification', 'email')),
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 同じイベント・ユーザー・時間の組み合わせは1つのみ
    UNIQUE(event_id, user_id, minutes_before)
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_events_group_id ON public.events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);

CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON public.event_participants(status);

CREATE INDEX IF NOT EXISTS idx_event_reminders_event_id ON public.event_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_event_reminders_user_id ON public.event_reminders(user_id);

-- RLS (Row Level Security) ポリシー設定

-- eventsテーブルのRLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- eventsテーブル: グループメンバーのみ閲覧可能
CREATE POLICY "Groups members can view events" ON public.events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = events.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- eventsテーブル: グループメンバーのみ作成可能
CREATE POLICY "Group members can create events" ON public.events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = events.group_id
            AND group_members.user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- eventsテーブル: 作成者のみ更新可能
CREATE POLICY "Event creators can update their events" ON public.events
    FOR UPDATE USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- eventsテーブル: 作成者のみ削除可能
CREATE POLICY "Event creators can delete their events" ON public.events
    FOR DELETE USING (created_by = auth.uid());

-- event_participantsテーブルのRLS
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- event_participantsテーブル: イベントが見える人のみ参加者情報も閲覧可能
CREATE POLICY "Event viewers can view participants" ON public.event_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events
            JOIN public.group_members ON group_members.group_id = events.group_id
            WHERE events.id = event_participants.event_id
            AND group_members.user_id = auth.uid()
        )
    );

-- event_participantsテーブル: グループメンバーは自分の参加状況を作成・更新可能
CREATE POLICY "Group members can manage their participation" ON public.event_participants
    FOR ALL USING (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.events
            JOIN public.group_members ON group_members.group_id = events.group_id
            WHERE events.id = event_participants.event_id
            AND group_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.events
            JOIN public.group_members ON group_members.group_id = events.group_id
            WHERE events.id = event_participants.event_id
            AND group_members.user_id = auth.uid()
        )
    );

-- event_remindersテーブルのRLS
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;

-- event_remindersテーブル: 自分のリマインダーのみ管理可能
CREATE POLICY "Users can manage their own reminders" ON public.event_reminders
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 更新トリガー関数（updated_atの自動更新）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルに更新トリガーを設定
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_participants_updated_at BEFORE UPDATE ON public.event_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_reminders_updated_at BEFORE UPDATE ON public.event_reminders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- サンプルデータ（テスト用）
-- 実際の運用前には削除してください

-- INSERT INTO public.events (
--     group_id, 
--     title, 
--     description, 
--     type, 
--     start_date, 
--     start_time, 
--     is_all_day, 
--     created_by
-- ) VALUES (
--     'your-group-id-here',
--     'チームミーティング',
--     '週次の進捗確認ミーティングです',
--     'single',
--     CURRENT_DATE + INTERVAL '1 day',
--     '14:00',
--     false,
--     'your-user-id-here'
-- );

-- 実行後の確認クエリ
-- SELECT 
--     schemaname, 
--     tablename, 
--     tableowner, 
--     hasindexes, 
--     hasrules, 
--     hastriggers 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('events', 'event_participants', 'event_reminders');

-- ポリシー確認
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('events', 'event_participants', 'event_reminders');

-- テーブル作成完了メッセージ
DO $$
BEGIN
    RAISE NOTICE 'イベント管理テーブルの作成が完了しました。';
    RAISE NOTICE '- events: イベント情報';
    RAISE NOTICE '- event_participants: 参加者情報';  
    RAISE NOTICE '- event_reminders: リマインダー設定';
    RAISE NOTICE 'RLSポリシーも設定済みです。';
END $$;