-- group_invitationsテーブルの作成

-- 既存のテーブルがあれば削除
DROP TABLE IF EXISTS public.group_invitations CASCADE;

-- グループ招待テーブル
CREATE TABLE public.group_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_type TEXT NOT NULL CHECK (invite_type IN ('link', 'qr', 'username')),
    invite_code TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 12),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ,
    CONSTRAINT unique_pending_invitation UNIQUE(group_id, invited_user_id, status)
);

-- インデックス
CREATE INDEX idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX idx_group_invitations_invited_by ON public.group_invitations(invited_by);
CREATE INDEX idx_group_invitations_invited_user_id ON public.group_invitations(invited_user_id);
CREATE INDEX idx_group_invitations_invite_code ON public.group_invitations(invite_code);
CREATE INDEX idx_group_invitations_status ON public.group_invitations(status);
CREATE INDEX idx_group_invitations_expires_at ON public.group_invitations(expires_at);

-- RLSを有効化
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
    FOR UPDATE USING (invited_user_id = auth.uid() OR invited_by = auth.uid());

-- 作成者と管理者は招待を削除可能
CREATE POLICY "Group admins can delete invitations" ON public.group_invitations
    FOR DELETE USING (
        invited_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = group_invitations.group_id
            AND group_members.user_id = auth.uid()
            AND group_members.role IN ('creator', 'admin')
        )
    );

-- 有効期限切れの招待を自動的に期限切れステータスに更新する関数
CREATE OR REPLACE FUNCTION update_expired_invitations()
RETURNS void AS $$
BEGIN
    UPDATE public.group_invitations
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 定期的に有効期限切れの招待を更新するためのcronジョブ設定（Supabaseの場合は別途設定が必要）