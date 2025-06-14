# データベース統合マイグレーションガイド

## 概要
このガイドでは、分散していたスキーマファイルを統合した `schema-consolidated.sql` への移行手順を説明します。

## 🚨 実行前の重要な注意事項

### 必須作業
1. **現在のデータベースを完全バックアップしてください**
2. **本番環境では実行しないでください**（テスト環境で検証後に実行）
3. **アプリケーションを一時停止してください**

### バックアップ方法
```bash
# Supabaseダッシュボードから
# Settings → Database → Backups → Create backup

# またはpg_dumpを使用
pg_dump -h your-db-host -U postgres -d your-db-name > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 📋 変更内容の詳細

### 修正された型不整合
1. **eventsテーブル**:
   - `event_type` → `type`
   - `start_time/end_time` → `start_date/end_date` + `start_time/end_time` + `is_all_day`

2. **event_participantsテーブル**:
   - `'maybe'` → `'pending'`
   - `response_message`カラム追加
   - `created_at`, `updated_at`カラム追加

3. **groupsテーブル**:
   - `icon_type`, `icon_emoji`, `icon_image_url`カラム追加
   - `theme_color`カラム追加
   - `recurring_schedule`カラム追加
   - `created_by`, `settings`カラム追加

4. **group_membersテーブル**:
   - `role`カラム追加

5. **group_invitationsテーブル**:
   - 完全に新しいテーブル

## 🔄 マイグレーション手順

### Step 1: 現在の状態確認
```sql
-- 既存テーブルの確認
SELECT schemaname, tablename, tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 既存データ数の確認
SELECT 
  'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'groups', COUNT(*) FROM public.groups
UNION ALL
SELECT 'group_members', COUNT(*) FROM public.group_members
UNION ALL
SELECT 'events', COUNT(*) FROM public.events
UNION ALL
SELECT 'event_participants', COUNT(*) FROM public.event_participants;
```

### Step 2: データ退避（安全対策）
```sql
-- 重要データを一時テーブルに退避
CREATE TABLE backup_groups AS SELECT * FROM public.groups;
CREATE TABLE backup_events AS SELECT * FROM public.events;
CREATE TABLE backup_event_participants AS SELECT * FROM public.event_participants;
```

### Step 3: 新しいカラムを段階的に追加

#### 3-1: groupsテーブルの拡張
```sql
-- 新しいカラムを追加
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS icon_type TEXT CHECK (icon_type IN ('emoji', 'image')) DEFAULT 'emoji',
ADD COLUMN IF NOT EXISTS icon_emoji TEXT DEFAULT '🎉',
ADD COLUMN IF NOT EXISTS icon_image_url TEXT,
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'primary' CHECK (theme_color IN ('primary', 'secondary', 'accent', 'sand', 'mystic')),
ADD COLUMN IF NOT EXISTS recurring_schedule JSONB,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
```

#### 3-2: group_membersテーブルの拡張
```sql
-- roleカラム追加
ALTER TABLE public.group_members 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'admin', 'member'));

-- 既存の作成者をcreatorに設定
UPDATE public.group_members 
SET role = 'creator' 
WHERE user_id IN (
  SELECT created_by FROM public.groups WHERE created_by IS NOT NULL
);
```

#### 3-3: eventsテーブルの調整
```sql
-- 新しいカラム構造に対応
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN DEFAULT false;

-- 既存データの移行
UPDATE public.events 
SET 
  type = event_type,
  start_date = start_time::date,
  end_date = end_time::date
WHERE type IS NULL;

-- 古いカラムを削除（データ移行後）
-- ALTER TABLE public.events DROP COLUMN IF EXISTS event_type;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS start_time CASCADE;
-- ALTER TABLE public.events DROP COLUMN IF EXISTS end_time CASCADE;
```

#### 3-4: event_participantsテーブルの調整
```sql
-- 新しいカラム追加
ALTER TABLE public.event_participants 
ADD COLUMN IF NOT EXISTS response_message TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 'maybe' → 'pending' への変更
UPDATE public.event_participants 
SET status = 'pending' 
WHERE status = 'maybe';

-- CHECK制約の更新
ALTER TABLE public.event_participants 
DROP CONSTRAINT IF EXISTS event_participants_status_check;

ALTER TABLE public.event_participants 
ADD CONSTRAINT event_participants_status_check 
CHECK (status IN ('attending', 'not_attending', 'pending'));
```

### Step 4: 新しいテーブルの作成
```sql
-- group_invitationsテーブル作成
CREATE TABLE IF NOT EXISTS public.group_invitations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    invited_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    invite_type TEXT CHECK (invite_type IN ('link', 'qr', 'username')) NOT NULL DEFAULT 'link',
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(group_id, invited_user_id)
);
```

### Step 5: 新しい関数とトリガーの適用
```sql
-- 統合スキーマから関数とトリガー部分を実行
-- (schema-consolidated.sqlの該当部分をコピー&実行)
```

### Step 6: RLSポリシーの更新
```sql
-- 古いポリシーを削除して新しいポリシーを適用
-- (schema-consolidated.sqlのRLS部分をコピー&実行)
```

### Step 7: データ整合性確認
```sql
-- 移行後のデータ確認
SELECT 
  'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'groups', COUNT(*) FROM public.groups
UNION ALL
SELECT 'group_members', COUNT(*) FROM public.group_members
UNION ALL
SELECT 'group_invitations', COUNT(*) FROM public.group_invitations
UNION ALL
SELECT 'events', COUNT(*) FROM public.events
UNION ALL
SELECT 'event_participants', COUNT(*) FROM public.event_participants;

-- 新しいカラムの確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'groups' AND table_schema = 'public'
ORDER BY ordinal_position;
```

## 🧪 テスト項目

### 1. 基本機能テスト
- [ ] ユーザー認証・プロフィール更新
- [ ] グループ作成・参加・脱退
- [ ] イベント作成・編集・削除
- [ ] イベント参加状況変更
- [ ] チャット送信・受信

### 2. 新機能テスト
- [ ] グループアイコン・テーマ設定
- [ ] グループ招待システム
- [ ] イベント優先度・ステータス設定
- [ ] 参加者コメント機能

### 3. パフォーマンステスト
- [ ] 大量データでの動作確認
- [ ] RLSポリシーの動作確認
- [ ] インデックス効果の確認

## 🔧 ロールバック手順

問題が発生した場合の緊急対応：

```sql
-- Step 1: バックアップからの復元
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- バックアップファイルを復元
\\i backup_YYYYMMDD_HHMMSS.sql

-- Step 2: 古いスキーマファイルの再適用
\\i schema.sql
-- 追加で必要な個別SQLファイルを実行
```

## 📝 移行後の作業

### 1. アプリケーション側の修正
- [ ] 型定義ファイルの更新確認
- [ ] EventServiceの修正（フィールド名変更対応）
- [ ] GroupServiceの修正（新しいカラム対応）
- [ ] コンポーネントでの型エラー修正

### 2. 監視・メンテナンス
- [ ] エラーログの監視
- [ ] パフォーマンス監視
- [ ] 定期的なバックアップ設定

## ⚡ クイック実行版（テスト環境用）

テスト環境で一括実行する場合：

```bash
# 1. バックアップ
pg_dump -h your-db-host -U postgres -d your-db-name > backup.sql

# 2. 統合スキーマ実行
psql -h your-db-host -U postgres -d your-db-name -f schema-consolidated.sql

# 3. 確認
psql -h your-db-host -U postgres -d your-db-name -c "\\dt"
```

## 🆘 トラブルシューティング

### よくある問題と解決方法

1. **外部キー制約エラー**
   ```sql
   -- 一時的に制約を無効化
   SET session_replication_role = replica;
   -- 作業実行
   SET session_replication_role = DEFAULT;
   ```

2. **RLSポリシーエラー**
   ```sql
   -- 一時的にRLSを無効化
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   -- 作業実行後に再有効化
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
   ```

3. **型変換エラー**
   ```sql
   -- データ型を段階的に変更
   ALTER TABLE table_name ALTER COLUMN column_name TYPE new_type USING column_name::new_type;
   ```

## 📞 サポート

問題が発生した場合は、以下の情報を含めて報告してください：
- エラーメッセージ全文
- 実行したSQL文
- 現在のデータベース状態（\\dt, \\d table_name の結果）
- アプリケーションログ