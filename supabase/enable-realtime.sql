-- リアルタイム機能の有効化

-- メッセージテーブルでリアルタイム機能を有効化
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- スタンプテーブルでリアルタイム機能を有効化
ALTER TABLE public.stamps REPLICA IDENTITY FULL;

-- プロファイルテーブルでリアルタイム機能を有効化
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

-- パブリケーション（リアルタイム配信）の確認・作成
DO $$
BEGIN
    -- メッセージテーブルをリアルタイム配信に追加
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) THEN
        -- messagesテーブルをリアルタイム配信に追加
        -- 注意: この操作はSupabaseダッシュボードで行うか、適切な権限が必要
        RAISE NOTICE 'messagesテーブルをSupabaseダッシュボードのDatabase > Replication でリアルタイム配信に追加してください';
    END IF;
END
$$;

-- 現在のリアルタイム設定確認
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY schemaname, tablename;