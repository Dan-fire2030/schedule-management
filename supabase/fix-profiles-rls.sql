-- プロフィール作成のRLSポリシーを修正

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 新しいポリシーを作成
-- 誰でもプロフィールを閲覧可能
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

-- ユーザーは自分のプロフィールを作成可能
CREATE POLICY "Users can create own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ユーザーは自分のプロフィールを更新可能
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ユーザーは自分のプロフィールを削除可能
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- プロフィールテーブルの権限を確認
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;