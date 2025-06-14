-- リアルタイム機能の設定状況を確認するためのクエリ

-- 1. messagesテーブルのREPLICA IDENTITYの確認
SELECT 
    schemaname,
    tablename,
    case 
        when relreplident = 'd' then 'DEFAULT' 
        when relreplident = 'n' then 'NOTHING'
        when relreplident = 'f' then 'FULL'
        when relreplident = 'i' then 'INDEX'
    end as replica_identity
FROM pg_class 
JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
WHERE schemaname = 'public' 
AND tablename = 'messages';

-- 2. リアルタイムパブリケーションの状況確認
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;

-- 3. messagesテーブルがリアルタイムパブリケーションに含まれているかチェック
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'messages'
            AND schemaname = 'public'
        ) THEN 'messagesテーブルはリアルタイム配信に含まれています'
        ELSE 'messagesテーブルはリアルタイム配信に含まれていません'
    END as realtime_status;

-- 4. 必要に応じてmessagesテーブルをリアルタイム配信に追加
-- 注意: この操作はSupabaseダッシュボードで行うことを推奨
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 5. リアルタイム設定の推奨状態確認
SELECT 
    'messages' as table_name,
    CASE 
        WHEN replica_identity = 'FULL' THEN '✓'
        ELSE '✗ (REPLICA IDENTITY FULLが必要)'
    END as replica_identity_status,
    CASE 
        WHEN publication_exists THEN '✓'
        ELSE '✗ (supabase_realtimeパブリケーションに追加が必要)'
    END as publication_status
FROM (
    SELECT 
        CASE 
            WHEN relreplident = 'f' THEN 'FULL'
            ELSE 'NOT_FULL'
        END as replica_identity,
        EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'messages'
            AND schemaname = 'public'
        ) as publication_exists
    FROM pg_class 
    JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
    WHERE schemaname = 'public' 
    AND tablename = 'messages'
) status;

-- 6. Supabaseダッシュボードでの設定手順を表示
SELECT 
    '手動設定が必要な場合:' as info,
    '1. Supabaseダッシュボード → Database → Replication' as step1,
    '2. messagesテーブルを選択してリアルタイム配信を有効化' as step2,
    '3. 変更を保存' as step3;