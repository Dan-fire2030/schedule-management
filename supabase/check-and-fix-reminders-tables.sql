-- 既存のテーブルとカラムを確認して修正するSQL

-- 1. 既存のremindersテーブルの構造を確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reminders'
ORDER BY ordinal_position;

-- 2. 既存のnotification_settingsテーブルの構造を確認
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notification_settings'
ORDER BY ordinal_position;

-- 3. もしテーブルが存在しない場合は作成、存在する場合は必要なカラムを追加
-- reminders テーブルの処理
DO $$
BEGIN
    -- テーブルが存在しない場合は作成
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminders') THEN
        CREATE TABLE reminders (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            event_id UUID REFERENCES events(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            message TEXT,
            reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
            notification_type TEXT NOT NULL DEFAULT 'email',
            is_sent BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    ELSE
        -- テーブルが存在する場合は、必要なカラムを追加
        -- reminder_timeカラムが存在しない場合は追加
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'reminders' AND column_name = 'reminder_time') THEN
            ALTER TABLE reminders ADD COLUMN reminder_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
        END IF;
        
        -- 他の必要なカラムも同様にチェックして追加
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'reminders' AND column_name = 'notification_type') THEN
            ALTER TABLE reminders ADD COLUMN notification_type TEXT NOT NULL DEFAULT 'email';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'reminders' AND column_name = 'is_sent') THEN
            ALTER TABLE reminders ADD COLUMN is_sent BOOLEAN DEFAULT false;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns 
                      WHERE table_name = 'reminders' AND column_name = 'updated_at') THEN
            ALTER TABLE reminders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- notification_settings テーブルの処理
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notification_settings') THEN
        CREATE TABLE notification_settings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
            email_enabled BOOLEAN DEFAULT true,
            push_enabled BOOLEAN DEFAULT false,
            sms_enabled BOOLEAN DEFAULT false,
            reminder_default_time INTEGER DEFAULT 30,
            quiet_hours_start TIME,
            quiet_hours_end TIME,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- インデックスの作成（存在しない場合のみ）
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_event_id ON reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_reminders_reminder_time ON reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_reminders_is_sent ON reminders(is_sent);

-- RLSポリシーの設定
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除してから再作成
DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can create own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON reminders;

CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders" ON reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

-- notification_settingsのポリシー
DROP POLICY IF EXISTS "Users can view own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can create own notification settings" ON notification_settings;
DROP POLICY IF EXISTS "Users can update own notification settings" ON notification_settings;

CREATE POLICY "Users can view own notification settings" ON notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notification settings" ON notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- トリガーの設定
DROP TRIGGER IF EXISTS update_reminders_updated_at ON reminders;
DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 最後に、再度テーブル構造を確認
SELECT 'reminders table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reminders'
ORDER BY ordinal_position;

SELECT 'notification_settings table columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notification_settings'
ORDER BY ordinal_position;