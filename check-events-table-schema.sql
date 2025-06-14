-- eventsテーブルの実際の構造を確認
-- Supabase SQL Editorで実行してください

-- 1. eventsテーブルの全カラムを確認
SELECT 
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'events'
ORDER BY ordinal_position;

-- 2. typeカラムの存在確認
SELECT 
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'events'
  AND column_name = 'type';

-- 3. 既存のcreate_event_rpc関数を確認
SELECT 
  proname AS function_name,
  pg_get_functiondef(oid) AS function_definition
FROM pg_proc
WHERE proname = 'create_event_rpc'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');