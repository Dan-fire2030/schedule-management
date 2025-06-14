# Google認証 + Supabase設定ガイド

## 🚀 概要
家計簿アプリにGoogle認証機能を追加するための完全ガイドです。

---

## 📋 必要な作業一覧
- [ ] Google Cloud Consoleでプロジェクト作成
- [ ] OAuth同意画面の設定
- [ ] OAuth認証情報の作成
- [ ] SupabaseでGoogle認証を有効化
- [ ] 動作確認

---

## 🔧 ステップ1: Google Cloud Console設定

### 1.1 プロジェクト作成
1. **Google Cloud Console**にアクセス
   ```
   https://console.cloud.google.com/
   ```

2. **新しいプロジェクトを作成**
   - 「プロジェクトを選択」→「新しいプロジェクト」
   - プロジェクト名: `家計簿アプリ`
   - 「作成」をクリック

### 1.2 OAuth同意画面の設定
1. **左メニュー**: APIとサービス → OAuth同意画面
2. **ユーザータイプ**: 外部（個人利用の場合）
3. **アプリ情報を入力**:
   - アプリ名: `家計簿アプリ`
   - ユーザーサポートメール: あなたのGmail
   - デベロッパー連絡先: あなたのGmail
4. **スコープ**: デフォルトのまま
5. **テストユーザー**: 必要に応じて追加

### 1.3 OAuth認証情報の作成
1. **左メニュー**: APIとサービス → 認証情報
2. **認証情報を作成** → OAuth 2.0 クライアントID
3. **設定内容**:
   - アプリケーションの種類: `ウェブアプリケーション`
   - 名前: `家計簿アプリ Web Client`
   - 承認済みリダイレクトURI:
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     ```
     ※ `your-project-id`を実際のSupabaseプロジェクトIDに置き換え

4. **認証情報をコピー**:
   - ✅ クライアントID
   - ✅ クライアントシークレット

---

## 🗄️ ステップ2: Supabase設定

### 2.1 Google認証の有効化
1. **Supabaseダッシュボード**にアクセス
   ```
   https://supabase.com/dashboard
   ```

2. **プロジェクトを選択** → Authentication → Providers

3. **Googleを設定**:
   - 「Google」をクリック
   - ✅ Enable sign in with Google
   - Client ID: 先ほどコピーしたID
   - Client Secret: 先ほどコピーしたシークレット
   - 「Save」をクリック

### 2.2 プロジェクトIDの確認方法
Supabaseダッシュボードの**Settings** → **General**で確認可能:
```
Project URL: https://your-project-id.supabase.co
```

---

## 🌐 ステップ3: Vercel環境変数確認

### 3.1 必要な環境変数
Vercelダッシュボードで以下が設定済みか確認:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3.2 環境変数の設定場所
- Vercelダッシュボード
- プロジェクト選択
- Settings → Environment Variables

---

## ✅ ステップ4: 動作確認

### 4.1 テスト手順
1. **アプリにアクセス**
2. **「Googleでログイン」ボタンをクリック**
3. **Google認証画面が表示される**
4. **Googleアカウントでログイン**
5. **アプリに戻ってログイン完了**

### 4.2 成功の確認
- ✅ アプリの左上にメールアドレスが表示
- ✅ メインの家計簿機能が利用可能
- ✅ ログアウトボタンが機能

---

## 💰 料金について

| サービス | 料金 | 制限 |
|---------|------|------|
| Google Cloud Console | **無料** | なし |
| Google Sign-In API | **無料** | なし |
| OAuth認証 | **無料** | ユーザー数無制限 |

> **💡 ポイント**: OAuth認証のみの利用では一切課金されません

---

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. 「redirect_uri_mismatch」エラー
**原因**: リダイレクトURIが間違っている
**解決**: Google Cloud ConsoleのリダイレクトURIを確認
```
正しい形式: https://your-project-id.supabase.co/auth/v1/callback
```

#### 2. 「invalid_client」エラー
**原因**: クライアントIDまたはシークレットが間違っている
**解決**: Supabaseの設定を再確認

#### 3. Google認証画面が表示されない
**原因**: OAuth同意画面が未設定
**解決**: Google Cloud ConsoleでOAuth同意画面を設定

---

## 📚 参考リンク

- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

---

## 🎉 完了！

設定が完了すると、ユーザーはワンクリックでGoogleアカウントを使ってログインできるようになります！