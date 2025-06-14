-- グループ機能の拡張
-- アイコン、テーマカラー、定期開催スケジュールを追加

-- groupsテーブルに新しいカラムを追加
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS icon_type TEXT CHECK (icon_type IN ('emoji', 'image')) DEFAULT 'emoji',
ADD COLUMN IF NOT EXISTS icon_emoji TEXT,
ADD COLUMN IF NOT EXISTS icon_image_url TEXT,
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'primary' CHECK (theme_color IN ('primary', 'secondary', 'accent', 'sand', 'mystic')),
ADD COLUMN IF NOT EXISTS recurring_schedule JSONB, -- 定期開催スケジュール
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'; -- グループ設定

-- グループ招待テーブル（承認制のため）
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

-- グループ招待のインデックス
CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invited_user_id ON public.group_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON public.group_invitations(status);

-- 招待の有効期限チェック関数
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

-- グループメンバーに役割カラムを追加（将来の拡張用）
ALTER TABLE public.group_members 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member'));

-- 作成者を自動的にcreatorにするトリガー
CREATE OR REPLACE FUNCTION public.set_group_creator()
RETURNS TRIGGER AS $$
BEGIN
    -- グループ作成者をメンバーテーブルに追加
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'creator');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS set_group_creator_trigger
    AFTER INSERT ON public.groups
    FOR EACH ROW 
    EXECUTE FUNCTION public.set_group_creator();

-- グループ招待のRLS
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- 招待は関係者のみ閲覧可能
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

-- グループメンバーは招待を作成可能
CREATE POLICY "Group members can create invitations" ON public.group_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = group_invitations.group_id
            AND group_members.user_id = auth.uid()
        )
        AND auth.uid() = invited_by
    );

-- 招待されたユーザーは自分の招待を更新可能
CREATE POLICY "Invited users can update their invitations" ON public.group_invitations
    FOR UPDATE USING (invited_user_id = auth.uid());

-- グループの更新権限を修正（全員が編集可能）
DROP POLICY IF EXISTS "Groups are updatable by members" ON public.groups;
CREATE POLICY "Groups are updatable by members" ON public.groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );

-- プリセット絵文字データ
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

-- 招待の有効期限を自動チェックするための関数（cron jobで実行想定）
CREATE OR REPLACE FUNCTION public.auto_expire_invitations()
RETURNS void AS $$
BEGIN
    PERFORM public.check_invitation_expiry();
END;
$$ LANGUAGE plpgsql;