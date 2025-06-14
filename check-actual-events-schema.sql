-- 実際のeventsテーブルの構造を確認
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'events'
ORDER BY ordinal_position;

-- eventsテーブルが存在するか確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'events';

-- 既存のデータを確認（存在する場合）
SELECT COUNT(*) as event_count FROM public.events;

-- テーブル定義を表示（代替方法）
SELECT 
  'CREATE TABLE ' || schemaname || '.' || tablename || ' (' || 
  string_agg(
    column_name || ' ' || data_type || 
    CASE 
      WHEN character_maximum_length IS NOT NULL THEN '(' || character_maximum_length || ')'
      WHEN numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL THEN '(' || numeric_precision || ',' || numeric_scale || ')'
      WHEN numeric_precision IS NOT NULL THEN '(' || numeric_precision || ')'
      ELSE ''
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
    ', '
  ) || ');' AS table_definition
FROM information_schema.columns c
JOIN pg_tables t ON c.table_name = t.tablename
WHERE c.table_schema = 'public' 
  AND c.table_name = 'events'
GROUP BY schemaname, tablename;