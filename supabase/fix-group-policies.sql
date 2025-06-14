-- グループ作成時の無限再帰エラーを修正

-- 既存のトリガーとポリシーを削除
DROP TRIGGER IF EXISTS set_group_creator_trigger ON public.groups;
DROP FUNCTION IF EXISTS public.set_group_creator();

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Group members are viewable by group members" ON public.group_members;
DROP POLICY IF EXISTS "Group members can be inserted by authenticated users" ON public.group_members;
DROP POLICY IF EXISTS "Group members can be updated by themselves or admins" ON public.group_members;
DROP POLICY IF EXISTS "Group members can be deleted by themselves or admins" ON public.group_members;

-- シンプルなポリシーに変更
-- メンバーは同じグループのメンバーのみ閲覧可能
CREATE POLICY "Enable read access for group members" ON public.group_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
        )
    );

-- 認証済みユーザーはメンバーを追加可能（グループ作成時など）
CREATE POLICY "Enable insert for authenticated users" ON public.group_members
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 自分自身またはグループ管理者は更新可能
CREATE POLICY "Enable update for users based on user_id" ON public.group_members
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
            AND gm.role IN ('creator', 'admin')
        )
    );

-- 自分自身またはグループ管理者は削除可能
CREATE POLICY "Enable delete for users based on user_id" ON public.group_members
    FOR DELETE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
            AND gm.role IN ('creator', 'admin')
        )
    );

-- グループテーブルのポリシーも簡素化
DROP POLICY IF EXISTS "Groups are viewable by members" ON public.groups;
DROP POLICY IF EXISTS "Groups are insertable by authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Groups are updatable by members" ON public.groups;
DROP POLICY IF EXISTS "Groups are deletable by creator" ON public.groups;

-- 認証済みユーザーは全てのグループを閲覧可能（後で制限する場合は変更）
CREATE POLICY "Enable read access for authenticated users" ON public.groups
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 認証済みユーザーはグループを作成可能
CREATE POLICY "Enable insert for authenticated users" ON public.groups
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- グループメンバーは更新可能
CREATE POLICY "Enable update for group members" ON public.groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );

-- 作成者はグループを削除可能
CREATE POLICY "Enable delete for group creator" ON public.groups
    FOR DELETE USING (created_by = auth.uid());