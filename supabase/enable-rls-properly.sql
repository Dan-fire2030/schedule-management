-- 適切なRLSポリシーを設定してセキュリティを確保

-- RLSを再有効化
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- groupsテーブルのポリシー
-- 認証済みユーザーは全てのグループを閲覧可能
CREATE POLICY "Authenticated users can view groups" ON public.groups
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 認証済みユーザーはグループを作成可能
CREATE POLICY "Authenticated users can create groups" ON public.groups
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- 作成者のみグループを更新可能
CREATE POLICY "Creators can update their groups" ON public.groups
    FOR UPDATE USING (created_by = auth.uid());

-- 作成者のみグループを削除可能
CREATE POLICY "Creators can delete their groups" ON public.groups
    FOR DELETE USING (created_by = auth.uid());

-- group_membersテーブルのポリシー
-- 同じグループのメンバー情報を閲覧可能
CREATE POLICY "Users can view group members" ON public.group_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id 
            AND gm.user_id = auth.uid()
        )
    );

-- 認証済みユーザーは誰でもメンバーを追加可能（グループ作成時）
CREATE POLICY "Authenticated users can insert members" ON public.group_members
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 自分自身のメンバーシップのみ更新可能
CREATE POLICY "Users can update their own memberships" ON public.group_members
    FOR UPDATE USING (user_id = auth.uid());

-- 自分自身のメンバーシップのみ削除可能
CREATE POLICY "Users can delete their own memberships" ON public.group_members
    FOR DELETE USING (user_id = auth.uid());