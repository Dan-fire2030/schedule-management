-- 無限再帰を避ける正しいRLSポリシー

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Enable read access for group members" ON public.group_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.group_members;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.group_members;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.group_members;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Enable update for group members" ON public.groups;
DROP POLICY IF EXISTS "Enable delete for group creator" ON public.groups;

-- group_membersテーブルのシンプルなポリシー
-- 自分自身のメンバーシップのみ閲覧可能
CREATE POLICY "Users can view their own memberships" ON public.group_members
    FOR SELECT USING (user_id = auth.uid());

-- 認証済みユーザーは誰でもメンバーを追加可能（グループ作成時）
CREATE POLICY "Authenticated users can insert members" ON public.group_members
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 自分自身のメンバーシップのみ更新可能
CREATE POLICY "Users can update their own memberships" ON public.group_members
    FOR UPDATE USING (user_id = auth.uid());

-- 自分自身のメンバーシップのみ削除可能
CREATE POLICY "Users can delete their own memberships" ON public.group_members
    FOR DELETE USING (user_id = auth.uid());

-- groupsテーブルのシンプルなポリシー
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