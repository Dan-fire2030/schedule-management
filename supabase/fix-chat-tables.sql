-- チャット機能の修正SQL

-- プロファイルテーブルが存在することを確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- プロファイルテーブルが存在しない場合は作成
        CREATE TABLE public.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            username TEXT UNIQUE,
            nickname TEXT,
            avatar_url TEXT,
            bio TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- RLS有効化
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

        -- プロファイルポリシー
        CREATE POLICY "プロファイルは誰でも閲覧可能" ON public.profiles
            FOR SELECT USING (true);

        CREATE POLICY "ユーザーは自分のプロファイルを更新可能" ON public.profiles
            FOR UPDATE USING (auth.uid() = id);

        CREATE POLICY "ユーザーは自分のプロファイルを作成可能" ON public.profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END
$$;

-- メッセージテーブルが存在することを確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') THEN
        -- メッセージテーブルが存在しない場合は作成
        CREATE TABLE public.messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            content TEXT,
            message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'stamp')),
            stamp_id UUID REFERENCES public.stamps(id) ON DELETE SET NULL,
            edited_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- インデックス
        CREATE INDEX idx_messages_group_id ON public.messages(group_id);
        CREATE INDEX idx_messages_user_id ON public.messages(user_id);
        CREATE INDEX idx_messages_created_at ON public.messages(created_at);

        -- RLS有効化
        ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

        -- メッセージポリシー
        CREATE POLICY "グループメンバーはメッセージを閲覧可能" ON public.messages
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM public.group_members
                    WHERE group_members.group_id = messages.group_id
                    AND group_members.user_id = auth.uid()
                )
            );

        CREATE POLICY "グループメンバーはメッセージを作成可能" ON public.messages
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.group_members
                    WHERE group_members.group_id = messages.group_id
                    AND group_members.user_id = auth.uid()
                )
                AND auth.uid() = user_id
            );

        CREATE POLICY "メッセージ作成者は自分のメッセージを更新可能" ON public.messages
            FOR UPDATE USING (user_id = auth.uid());

        CREATE POLICY "メッセージ作成者は自分のメッセージを削除可能" ON public.messages
            FOR DELETE USING (user_id = auth.uid());
    END IF;
END
$$;

-- スタンプテーブルが存在することを確認
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stamps') THEN
        -- スタンプテーブルが存在しない場合は作成
        CREATE TABLE public.stamps (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            image_url TEXT,
            category TEXT DEFAULT 'default',
            created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            is_default BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        -- インデックス
        CREATE INDEX idx_stamps_category ON public.stamps(category);
        CREATE INDEX idx_stamps_is_default ON public.stamps(is_default);

        -- RLS有効化
        ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;

        -- スタンプポリシー
        CREATE POLICY "スタンプは誰でも閲覧可能" ON public.stamps
            FOR SELECT USING (true);

        CREATE POLICY "認証済みユーザーはスタンプを作成可能" ON public.stamps
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

        -- デフォルトスタンプの挿入
        INSERT INTO public.stamps (name, image_url, category, is_default) VALUES
            ('thumbs_up', '👍', 'reaction', true),
            ('heart', '❤️', 'reaction', true),
            ('laugh', '😂', 'emotion', true),
            ('surprise', '😮', 'emotion', true),
            ('sad', '😢', 'emotion', true),
            ('thinking', '🤔', 'emotion', true),
            ('clap', '👏', 'action', true),
            ('fire', '🔥', 'reaction', true),
            ('celebration', '🎉', 'celebration', true),
            ('ok', '👌', 'action', true);
    END IF;
END
$$;

-- テーブル構造確認用クエリ
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'messages', 'stamps')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;