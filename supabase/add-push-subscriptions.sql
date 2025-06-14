-- プッシュ通知購読テーブルの作成
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  keys jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, endpoint)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLSポリシー
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の購読のみアクセス可能
CREATE POLICY "Users can manage their own push subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id);

-- リマインダーテーブルにsent、sent_atカラムを追加（既に存在しない場合）
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'reminders' AND column_name = 'sent') THEN
    ALTER TABLE reminders ADD COLUMN sent boolean DEFAULT false NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'reminders' AND column_name = 'sent_at') THEN
    ALTER TABLE reminders ADD COLUMN sent_at timestamptz;
  END IF;
END $$;

-- sent=falseのリマインダーのみ取得するためのインデックス
CREATE INDEX IF NOT EXISTS idx_reminders_pending ON reminders(user_id, scheduled_at) 
WHERE sent = false;

-- 通知設定テーブルの作成（既に存在しない場合）
CREATE TABLE IF NOT EXISTS notification_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  push_enabled boolean DEFAULT false NOT NULL,
  email_enabled boolean DEFAULT true NOT NULL,
  sound_enabled boolean DEFAULT true NOT NULL,
  vibration_enabled boolean DEFAULT true NOT NULL,
  quiet_hours_start time DEFAULT '22:00' NOT NULL,
  quiet_hours_end time DEFAULT '08:00' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- notification_settingsのRLSポリシー
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification settings"
  ON notification_settings
  FOR ALL
  USING (auth.uid() = user_id);

-- 更新トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新トリガー
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 通知設定のデフォルト値を挿入する関数
CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ユーザー作成時に通知設定を自動作成
DROP TRIGGER IF EXISTS create_notification_settings_on_signup ON auth.users;
CREATE TRIGGER create_notification_settings_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_settings();

COMMENT ON TABLE push_subscriptions IS 'プッシュ通知の購読情報を保存';
COMMENT ON TABLE notification_settings IS 'ユーザーの通知設定を保存';