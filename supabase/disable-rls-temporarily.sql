-- 一時的にRLSを無効化してグループ作成をテストする

-- 既存のポリシーをすべて削除
DROP POLICY IF EXISTS "Enable read access for group members" ON public.group_members;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.group_members;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.group_members;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.group_members;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.groups;
DROP POLICY IF EXISTS "Enable update for group members" ON public.groups;
DROP POLICY IF EXISTS "Enable delete for group creator" ON public.groups;

-- RLSを一時的に無効化
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;

-- 注意: これは開発・テスト用です。本番環境では適切なポリシーを設定してください