-- スケマネ（Schedule Management）統合データベーススキーマ
-- 型定義ファイル (database.types.ts) との完全互換版
-- 作成日: 2025年6月14日

-- 必要な拡張機能を有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================
-- 1. プロフィールテーブル
-- ===========================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    nickname TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- ===========================
-- 2. グループテーブル（完全版）
-- ===========================
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    invite_code TEXT UNIQUE NOT NULL,
    
    -- アイコン設定
    icon_type TEXT CHECK (icon_type IN ('emoji', 'image')) DEFAULT 'emoji',
    icon_emoji TEXT,
    icon_image_url TEXT,
    
    -- テーマとスタイル
    theme_color TEXT DEFAULT 'primary' CHECK (theme_color IN ('primary', 'secondary', 'accent', 'sand', 'mystic')),
    
    -- 定期スケジュール設定（JSONB形式）
    recurring_schedule JSONB,
    
    -- 管理情報
    created_by UUID REFERENCES public.profiles(id),
    settings JSONB DEFAULT '{}',
    
    -- タイムスタンプ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- ===========================
-- 3. グループメンバーテーブル
-- ===========================
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- ===========================
-- 4. グループ招待テーブル
-- ===========================
CREATE TABLE IF NOT EXISTS public.group_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    invited_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    invite_type TEXT CHECK (invite_type IN ('link', 'qr', 'username')) NOT NULL DEFAULT 'link',
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(group_id, invited_user_id)
);

-- ===========================
-- 5. イベントテーブル（完全版）
-- ===========================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    
    -- イベント種別と状態
    type TEXT NOT NULL CHECK (type IN ('single', 'all_day', 'recurring', 'task')),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- 日時設定（型定義互換）
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    is_all_day BOOLEAN NOT NULL DEFAULT false,
    
    -- 場所情報
    location_name TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    
    -- 繰り返し設定
    recurrence_rule TEXT,
    
    -- 作成者・管理
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- ===========================
-- 6. イベント参加者テーブル
-- ===========================
CREATE TABLE IF NOT EXISTS public.event_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('attending', 'not_attending', 'pending')) NOT NULL DEFAULT 'pending',
    response_message TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    UNIQUE(event_id, user_id)
);

-- ===========================
-- 7. スタンプテーブル
-- ===========================
CREATE TABLE IF NOT EXISTS public.stamps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'custom',
    created_by UUID REFERENCES public.profiles(id),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- ===========================
-- 8. メッセージテーブル
-- ===========================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    message_type TEXT CHECK (message_type IN ('text', 'stamp')) NOT NULL DEFAULT 'text',
    stamp_id UUID REFERENCES public.stamps(id),
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- ===========================
-- 9. メッセージ既読テーブル
-- ===========================
CREATE TABLE IF NOT EXISTS public.message_reads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    UNIQUE(message_id, user_id)
);

-- ===========================
-- 10. リマインダーテーブル
-- ===========================
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    UNIQUE(event_id, user_id, remind_at)
);

-- ===========================
-- インデックス（パフォーマンス最適化）
-- ===========================

-- プロフィール
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- グループ関連
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invited_user_id ON public.group_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON public.group_invitations(status);

-- イベント関連
CREATE INDEX IF NOT EXISTS idx_events_group_id ON public.events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);

-- メッセージ関連
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON public.messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON public.message_reads(user_id);

-- リマインダー
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON public.reminders(remind_at) WHERE is_sent = FALSE;

-- ===========================
-- 関数とトリガー
-- ===========================

-- 更新日時の自動更新関数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 更新トリガー
CREATE TRIGGER IF NOT EXISTS set_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS set_groups_updated_at BEFORE UPDATE ON public.groups
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS set_events_updated_at BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER IF NOT EXISTS set_event_participants_updated_at BEFORE UPDATE ON public.event_participants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 招待コード生成関数
CREATE OR REPLACE FUNCTION public.generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    done BOOLEAN DEFAULT FALSE;
BEGIN
    WHILE NOT done LOOP
        code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
        done := NOT EXISTS(SELECT 1 FROM public.groups WHERE invite_code = code);
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- グループ作成者自動追加関数
CREATE OR REPLACE FUNCTION public.set_group_creator()
RETURNS TRIGGER AS $$
BEGIN
    -- グループ作成者をメンバーテーブルに追加
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'creator');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- グループ作成者自動追加トリガー
DROP TRIGGER IF EXISTS set_group_creator_trigger ON public.groups;
CREATE TRIGGER set_group_creator_trigger
    AFTER INSERT ON public.groups
    FOR EACH ROW 
    EXECUTE FUNCTION public.set_group_creator();

-- 招待有効期限チェック関数
CREATE OR REPLACE FUNCTION public.check_invitation_expiry()
RETURNS void AS $$
BEGIN
    UPDATE public.group_invitations 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at IS NOT NULL 
    AND expires_at < TIMEZONE('utc'::TEXT, NOW());
END;
$$ LANGUAGE plpgsql;

-- 招待自動期限切れ関数
CREATE OR REPLACE FUNCTION public.auto_expire_invitations()
RETURNS void AS $$
BEGIN
    PERFORM public.check_invitation_expiry();
END;
$$ LANGUAGE plpgsql;

-- 古いメッセージクリーンアップ関数（1ヶ月保持）
CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM public.messages
    WHERE created_at < TIMEZONE('utc'::TEXT, NOW()) - INTERVAL '1 month';
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- Row Level Security (RLS) 設定
-- ===========================

-- 全テーブルでRLSを有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- ===========================
-- プロフィールのRLSポリシー
-- ===========================
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ===========================
-- グループのRLSポリシー
-- ===========================
DROP POLICY IF EXISTS "Groups are viewable by members" ON public.groups;
CREATE POLICY "Groups are viewable by members" ON public.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Anyone can create a group" ON public.groups;
CREATE POLICY "Anyone can create a group" ON public.groups
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Groups are updatable by members" ON public.groups;
CREATE POLICY "Groups are updatable by members" ON public.groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );

-- ===========================
-- グループメンバーのRLSポリシー
-- ===========================
DROP POLICY IF EXISTS "Group members are viewable by group members" ON public.group_members;
CREATE POLICY "Group members are viewable by group members" ON public.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups" ON public.group_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===========================
-- グループ招待のRLSポリシー
-- ===========================
DROP POLICY IF EXISTS "Group invitations are viewable by related users" ON public.group_invitations;
CREATE POLICY "Group invitations are viewable by related users" ON public.group_invitations
    FOR SELECT USING (
        invited_by = auth.uid() 
        OR invited_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = group_invitations.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role IN ('creator', 'admin')
        )
    );

DROP POLICY IF EXISTS "Group members can create invitations" ON public.group_invitations;
CREATE POLICY "Group members can create invitations" ON public.group_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = group_invitations.group_id
            AND group_members.user_id = auth.uid()
        )
        AND auth.uid() = invited_by
    );

DROP POLICY IF EXISTS "Invited users can update their invitations" ON public.group_invitations;
CREATE POLICY "Invited users can update their invitations" ON public.group_invitations
    FOR UPDATE USING (invited_user_id = auth.uid());

-- ===========================
-- イベントのRLSポリシー
-- ===========================
DROP POLICY IF EXISTS "Events are viewable by group members" ON public.events;
CREATE POLICY "Events are viewable by group members" ON public.events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = events.group_id
            AND group_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Group members can create events" ON public.events;
CREATE POLICY "Group members can create events" ON public.events
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = events.group_id
            AND group_members.user_id = auth.uid()
        )
        AND auth.uid() = created_by
    );

DROP POLICY IF EXISTS "Group members can update events" ON public.events;
CREATE POLICY "Group members can update events" ON public.events
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = events.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- ===========================
-- イベント参加者のRLSポリシー
-- ===========================
DROP POLICY IF EXISTS "Event participants are viewable by group members" ON public.event_participants;
CREATE POLICY "Event participants are viewable by group members" ON public.event_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events
            JOIN public.group_members ON group_members.group_id = events.group_id
            WHERE events.id = event_participants.event_id
            AND group_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Group members can manage their participation" ON public.event_participants;
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

-- ===========================
-- メッセージのRLSポリシー
-- ===========================
DROP POLICY IF EXISTS "Messages are viewable by group members" ON public.messages;
CREATE POLICY "Messages are viewable by group members" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = messages.group_id
            AND group_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Group members can send messages" ON public.messages;
CREATE POLICY "Group members can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = messages.group_id
            AND group_members.user_id = auth.uid()
        )
        AND auth.uid() = user_id
    );

DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
CREATE POLICY "Users can update own messages" ON public.messages
    FOR UPDATE USING (auth.uid() = user_id);

-- ===========================
-- スタンプのRLSポリシー
-- ===========================
DROP POLICY IF EXISTS "Stamps are viewable by everyone" ON public.stamps;
CREATE POLICY "Stamps are viewable by everyone" ON public.stamps
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create their own stamps" ON public.stamps;
CREATE POLICY "Users can create their own stamps" ON public.stamps
    FOR INSERT WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- ===========================
-- メッセージ既読のRLSポリシー
-- ===========================
DROP POLICY IF EXISTS "Message reads are viewable by group members" ON public.message_reads;
CREATE POLICY "Message reads are viewable by group members" ON public.message_reads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.messages
            JOIN public.group_members ON group_members.group_id = messages.group_id
            WHERE messages.id = message_reads.message_id
            AND group_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can manage their own message reads" ON public.message_reads;
CREATE POLICY "Users can manage their own message reads" ON public.message_reads
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ===========================
-- リマインダーのRLSポリシー
-- ===========================
DROP POLICY IF EXISTS "Users can manage their own reminders" ON public.reminders;
CREATE POLICY "Users can manage their own reminders" ON public.reminders
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ===========================
-- 初期データ投入
-- ===========================

-- デフォルトスタンプの作成
INSERT INTO public.stamps (name, image_url, category, is_default) VALUES
('party', '🎉', 'preset_emoji', true),
('heart', '❤️', 'preset_emoji', true),
('thumbs_up', '👍', 'preset_emoji', true),
('clap', '👏', 'preset_emoji', true),
('fire', '🔥', 'preset_emoji', true),
('star', '⭐', 'preset_emoji', true),
('rainbow', '🌈', 'preset_emoji', true),
('magic', '✨', 'preset_emoji', true),
('sun', '☀️', 'preset_emoji', true),
('moon', '🌙', 'preset_emoji', true)
ON CONFLICT DO NOTHING;

-- ===========================
-- 完了メッセージ
-- ===========================
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'スケマネ 統合データベーススキーマ作成完了';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '作成されたテーブル:';
    RAISE NOTICE '- profiles: ユーザープロフィール';
    RAISE NOTICE '- groups: グループ情報（アイコン・テーマ含む）';
    RAISE NOTICE '- group_members: グループメンバー（役割含む）';
    RAISE NOTICE '- group_invitations: グループ招待管理';
    RAISE NOTICE '- events: イベント・予定管理';
    RAISE NOTICE '- event_participants: イベント参加者';
    RAISE NOTICE '- messages: チャットメッセージ';
    RAISE NOTICE '- stamps: チャットスタンプ';
    RAISE NOTICE '- message_reads: メッセージ既読管理';
    RAISE NOTICE '- reminders: リマインダー';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'RLSポリシー、インデックス、トリガーも設定完了';
    RAISE NOTICE 'database.types.ts との完全互換';
    RAISE NOTICE '===========================================';
END $$;