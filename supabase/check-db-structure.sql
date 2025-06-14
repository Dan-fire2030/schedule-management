-- データベース構造の確認

-- groupsテーブルの構造確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'groups' AND table_schema = 'public'
ORDER BY ordinal_position;

-- group_membersテーブルの構造確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'group_members' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 制約の確認
SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name IN ('groups', 'group_members') AND tc.table_schema = 'public';

-- RLSポリシーの確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('groups', 'group_members');