# Supabaseプロジェクトセットアップガイド

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
   - Project name: `schedule-management`
   - Database Password: 安全なパスワードを設定
   - Region: 東京（ap-northeast-1）を推奨

## 2. データベースのセットアップ

1. Supabaseダッシュボードで「SQL Editor」を開く
2. 以下の順番でSQLファイルを実行：
   ```sql
   -- 1. スキーマの作成
   supabase/schema.sql の内容をコピー＆ペースト

   -- 2. ストレージバケットの設定
   supabase/storage.sql の内容をコピー＆ペースト

   -- 3. シードデータの投入
   supabase/seed.sql の内容をコピー＆ペースト
   ```

## 3. 認証設定

### メール認証の設定
1. Authentication → Providers → Email を有効化
2. 以下の設定を確認：
   - Enable Email Signup: ON
   - Confirm Email: OFF（開発時）

### Google認証の設定
1. [Google Cloud Console](https://console.cloud.google.com) でプロジェクトを作成
2. OAuth 2.0 クライアントIDを作成
   - アプリケーションの種類: ウェブアプリケーション
   - 承認済みのリダイレクトURI: `https://kbimudrjdfvnregomkbm.supabase.co/auth/v1/callback`
3. Supabaseダッシュボードで設定
   - Authentication → Providers → Google を有効化
   - Client ID と Client Secret を入力

## 4. 環境変数の設定

1. Supabaseダッシュボードから以下の情報を取得：
   - Settings → API → Project URL
   - Settings → API → anon public key

2. `.env.local` ファイルを作成：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 5. ストレージの設定

1. Storage → Create a new bucket で以下を作成済み：
   - `avatars`: ユーザーアバター用
   - `stamps`: カスタムスタンプ用

2. 各バケットのポリシーは既にSQLで設定済み

## 6. リアルタイム設定

### 現在のSupabaseの仕様

2024年現在、Supabaseではリアルタイム機能がデフォルトで有効になっています。
Replication設定は「Coming Soon」となっており、特別な設定は不要です。

### リアルタイム機能の使用方法

リアルタイム機能は、コード側で以下のように実装します：

```typescript
// リアルタイムリスナーの設定例
const supabase = createClient()

// 1. メッセージのリアルタイム監視
const messagesChannel = supabase
  .channel('room-messages')
  .on(
    'postgres_changes',
    {
      event: '*', // 'INSERT' | 'UPDATE' | 'DELETE' | '*'
      schema: 'public',
      table: 'messages',
      filter: `group_id=eq.${groupId}` // 特定のグループのみ監視
    },
    (payload) => {
      console.log('メッセージの変更:', payload)
      // payload.eventType: 'INSERT' | 'UPDATE' | 'DELETE'
      // payload.new: 新しいデータ
      // payload.old: 古いデータ（UPDATEとDELETEの場合）
    }
  )
  .subscribe()

// 2. イベントのリアルタイム監視
const eventsChannel = supabase
  .channel('group-events')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'events',
      filter: `group_id=eq.${groupId}`
    },
    (payload) => {
      console.log('イベントの変更:', payload)
    }
  )
  .subscribe()

// 3. クリーンアップ（コンポーネントのアンマウント時など）
messagesChannel.unsubscribe()
eventsChannel.unsubscribe()
```

### 注意事項

1. **RLS（Row Level Security）の影響**
   - リアルタイムで受信できるのは、RLSポリシーで許可されたデータのみ
   - 適切なRLSポリシーが設定されていることを確認

2. **パフォーマンスの考慮**
   - 必要なテーブル・カラムのみを監視
   - filterを使用して不要なデータを除外
   - 不要になったらunsubscribeを忘れずに

3. **接続数の制限**
   - Free tier: 200同時接続
   - Pro tier: 500同時接続
   - 接続数を節約するため、1つのchannelで複数のテーブルを監視することも可能

### リアルタイム接続の確認（開発時）

```typescript
// テスト用コード
const supabase = createClient()

// メッセージのリアルタイム監視例
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    { 
      event: '*', 
      schema: 'public', 
      table: 'messages',
      filter: 'group_id=eq.YOUR_GROUP_ID' 
    },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

### 注意事項

- リアルタイム機能は、Free tierでは同時接続数に制限があります（200接続）
- 本番環境では、必要なテーブルのみリアルタイムを有効にすることを推奨
- フィルター（filter）を適切に設定して、不要なデータの送信を避ける

## 7. 定期タスクの設定（本番環境）

1. Database → Extensions で `pg_cron` を有効化
2. 以下のジョブを設定（1ヶ月以上前のメッセージを削除）：
   ```sql
   SELECT cron.schedule(
     'cleanup-old-messages',
     '0 2 * * *', -- 毎日午前2時に実行
     $$SELECT public.cleanup_old_messages()$$
   );
   ```

## 注意事項

- 開発環境では、RLS（Row Level Security）を一時的に無効にすることも可能ですが、本番環境では必ず有効にしてください
- データベースパスワードは安全に管理してください
- 本番環境では、メール認証を有効にすることを推奨します