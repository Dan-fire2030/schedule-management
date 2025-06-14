-- チャット機能のためのテーブル作成

-- 既存のテーブルがあれば削除
DROP TABLE IF EXISTS public.message_reads CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.stamps CASCADE;

-- スタンプテーブル
CREATE TABLE public.stamps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    emoji TEXT,
    image_url TEXT,
    is_custom BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT stamp_content_check CHECK (
        (emoji IS NOT NULL AND image_url IS NULL) OR
        (emoji IS NULL AND image_url IS NOT NULL)
    )
);

-- メッセージテーブル
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'stamp', 'system')),
    stamp_id UUID REFERENCES public.stamps(id) ON DELETE SET NULL,
    reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT message_content_check CHECK (
        (message_type = 'text' AND content IS NOT NULL AND stamp_id IS NULL) OR
        (message_type = 'stamp' AND stamp_id IS NOT NULL AND content IS NULL) OR
        (message_type = 'system' AND content IS NOT NULL AND stamp_id IS NULL)
    )
);

-- メッセージ既読テーブル
CREATE TABLE public.message_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- インデックス
CREATE INDEX idx_stamps_group_id ON public.stamps(group_id);
CREATE INDEX idx_stamps_created_by ON public.stamps(created_by);
CREATE INDEX idx_stamps_is_custom ON public.stamps(is_custom);

CREATE INDEX idx_messages_group_id ON public.messages(group_id);
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_message_type ON public.messages(message_type);
CREATE INDEX idx_messages_reply_to ON public.messages(reply_to);

CREATE INDEX idx_message_reads_message_id ON public.message_reads(message_id);
CREATE INDEX idx_message_reads_user_id ON public.message_reads(user_id);

-- RLSを有効化
ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Stamps RLS Policies
-- グループメンバーは全てのスタンプを閲覧可能
CREATE POLICY "Group members can view stamps" ON public.stamps
    FOR SELECT USING (
        group_id IS NULL OR  -- デフォルトスタンプ
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = stamps.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- グループメンバーはカスタムスタンプを作成可能
CREATE POLICY "Group members can create stamps" ON public.stamps
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = stamps.group_id
            AND group_members.user_id = auth.uid()
        )
        AND auth.uid() = created_by
    );

-- 作成者とグループ管理者はスタンプを更新可能
CREATE POLICY "Stamp creators and group admins can update stamps" ON public.stamps
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = stamps.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role IN ('creator', 'admin')
        )
    );

-- 作成者とグループ管理者はスタンプを削除可能
CREATE POLICY "Stamp creators and group admins can delete stamps" ON public.stamps
    FOR DELETE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = stamps.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role IN ('creator', 'admin')
        )
    );

-- Messages RLS Policies
-- グループメンバーはメッセージを閲覧可能
CREATE POLICY "Group members can view messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = messages.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- グループメンバーはメッセージを作成可能
CREATE POLICY "Group members can create messages" ON public.messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = messages.group_id
            AND group_members.user_id = auth.uid()
        )
        AND auth.uid() = user_id
    );

-- メッセージ作成者は自分のメッセージを更新可能
CREATE POLICY "Message authors can update their messages" ON public.messages
    FOR UPDATE USING (user_id = auth.uid());

-- メッセージ作成者とグループ管理者はメッセージを削除可能
CREATE POLICY "Message authors and group admins can delete messages" ON public.messages
    FOR DELETE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = messages.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role IN ('creator', 'admin')
        )
    );

-- Message Reads RLS Policies
-- グループメンバーは既読情報を閲覧可能
CREATE POLICY "Group members can view message reads" ON public.message_reads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.messages
            JOIN public.group_members ON messages.group_id = group_members.group_id
            WHERE messages.id = message_reads.message_id
            AND group_members.user_id = auth.uid()
        )
    );

-- ユーザーは自分の既読情報を作成可能
CREATE POLICY "Users can create their own message reads" ON public.message_reads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分の既読情報を更新可能
CREATE POLICY "Users can update their own message reads" ON public.message_reads
    FOR UPDATE USING (user_id = auth.uid());

-- ユーザーは自分の既読情報を削除可能
CREATE POLICY "Users can delete their own message reads" ON public.message_reads
    FOR DELETE USING (user_id = auth.uid());

-- トリガー関数: メッセージ更新時にupdated_atを自動更新
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_messages_updated_at_trigger
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_messages_updated_at();

-- デフォルトスタンプの挿入
INSERT INTO public.stamps (name, emoji, is_custom, group_id) VALUES
    ('thumbs_up', '👍', false, NULL),
    ('heart', '❤️', false, NULL),
    ('laugh', '😂', false, NULL),
    ('surprise', '😮', false, NULL),
    ('sad', '😢', false, NULL),
    ('angry', '😠', false, NULL),
    ('thinking', '🤔', false, NULL),
    ('clap', '👏', false, NULL),
    ('fire', '🔥', false, NULL),
    ('celebration', '🎉', false, NULL),
    -- 拡張スタンプセット
    ('wave', '👋', false, NULL),
    ('ok', '👌', false, NULL),
    ('peace', '✌️', false, NULL),
    ('muscle', '💪', false, NULL),
    ('pray', '🙏', false, NULL),
    ('sparkles', '✨', false, NULL),
    ('star', '⭐', false, NULL),
    ('rainbow', '🌈', false, NULL),
    ('sun', '☀️', false, NULL),
    ('moon', '🌙', false, NULL),
    ('coffee', '☕', false, NULL),
    ('cake', '🎂', false, NULL),
    ('pizza', '🍕', false, NULL),
    ('music', '🎵', false, NULL),
    ('camera', '📷', false, NULL),
    ('gift', '🎁', false, NULL),
    ('balloon', '🎈', false, NULL),
    ('check', '✅', false, NULL),
    ('x', '❌', false, NULL),
    ('warning', '⚠️', false, NULL),
    ('lightbulb', '💡', false, NULL),
    ('rocket', '🚀', false, NULL),
    ('crown', '👑', false, NULL),
    ('gem', '💎', false, NULL),
    ('magic', '🪄', false, NULL);