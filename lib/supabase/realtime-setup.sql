-- Supabase Realtime Setup for Messages Table
-- このSQLをSupabase SQL Editorで実行してください

-- 1. messagesテーブルにREPLICA IDENTITYを設定
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 2. messagesテーブルをsupabase_realtimeパブリケーションに追加
-- （既に追加されている場合はエラーが出ますが問題ありません）
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 3. RLSポリシーがリアルタイム用に設定されているか確認
-- messagesテーブルのRLSポリシーが存在することを確認
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'messages';

-- 4. パブリケーションの状態を確認
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 5. リアルタイム設定の確認
SELECT 
  schemaname,
  tablename,
  attname,
  type_name
FROM 
  pg_publication_tables pt
  JOIN pg_class c ON c.relname = pt.tablename
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_attribute a ON a.attrelid = c.oid
  JOIN pg_type t ON t.oid = a.atttypid
WHERE 
  pt.pubname = 'supabase_realtime' 
  AND pt.tablename = 'messages'
  AND a.attnum > 0
ORDER BY a.attnum;