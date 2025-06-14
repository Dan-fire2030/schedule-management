# Google Maps API設定ガイド

## 概要
このプロジェクトではGoogle Maps APIを使用して位置情報・地図表示機能を提供しています。

## 必要なAPI
以下のGoogle Cloud Platform APIを有効化する必要があります：
- Maps JavaScript API
- Places API
- Geocoding API

## セットアップ手順

### 1. Google Cloud Platformプロジェクトの作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. プロジェクトIDをメモしておく

### 2. APIの有効化
1. Google Cloud Consoleで「APIとサービス」→「ライブラリ」へ移動
2. 以下のAPIを検索して有効化：
   - **Maps JavaScript API**
   - **Places API** 
   - **Geocoding API**

### 3. APIキーの作成
1. 「APIとサービス」→「認証情報」へ移動
2. 「認証情報を作成」→「APIキー」を選択
3. 作成されたAPIキーをコピー

### 4. APIキーの制限設定（推奨）
セキュリティのため、APIキーに制限を設定することを強く推奨します。

#### アプリケーション制限
- **HTTPリファラー（ウェブサイト）**を選択
- 許可するリファラーを追加：
  ```
  localhost:*
  127.0.0.1:*
  yourdomain.com/*
  *.yourdomain.com/*
  ```

#### API制限
- **キーを制限**を選択
- 以下のAPIのみを許可：
  - Maps JavaScript API
  - Places API
  - Geocoding API

### 5. 環境変数の設定
プロジェクトルートの`.env.local`ファイルに以下を追加：

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**注意：** `NEXT_PUBLIC_`プレフィックスを必ず付けてください。これによりクライアントサイドでAPIキーが利用可能になります。

### 6. 課金の設定
Google Maps APIは使用量に応じて課金されます：
- [料金ページ](https://cloud.google.com/maps-platform/pricing)で詳細を確認
- 使用量監視とアラートの設定を推奨
- 月額クレジット（$200）が提供されますが、超過分は課金されます

## 使用している機能

### Maps JavaScript API
- 地図の表示
- マーカーの表示
- ユーザーの地図操作（ズーム、パン）

### Places API
- 場所の検索（オートコンプリート）
- 場所の詳細情報取得
- 場所の評価・写真取得

### Geocoding API
- 住所から座標への変換
- 座標から住所への変換（逆ジオコーディング）

## トラブルシューティング

### APIキーが動作しない場合
1. APIキーの制限設定を確認
2. 対象のAPIが有効化されているか確認
3. 課金アカウントが設定されているか確認
4. ブラウザのコンソールでエラーメッセージを確認

### よくあるエラー

#### "This API project is not authorized to use this API"
- Places APIまたはMaps JavaScript APIが有効化されていない
- 該当APIをGoogle Cloud Consoleで有効化してください

#### "This page can't load Google Maps correctly"
- APIキーが正しく設定されていない
- `.env.local`ファイルを確認し、正しいAPIキーが設定されているか確認

#### "You must enable Billing on the Google Cloud Project"
- 課金が有効化されていない
- Google Cloud Consoleで課金アカウントを設定してください

### 制限と制約
- **1日あたりのリクエスト制限**：APIごとに異なる制限があります
- **同時リクエスト制限**：大量の同時リクエストは制限される場合があります
- **地域制限**：一部の機能は特定の地域でのみ利用可能です

## セキュリティ考慮事項

### APIキーの保護
- APIキーをGitにコミットしない（`.env.local`は`.gitignore`に含まれています）
- 本番環境では環境変数でAPIキーを管理
- 定期的なAPIキーのローテーション

### 使用量の監視
- Google Cloud Consoleで使用量を定期的に確認
- 予算アラートを設定して想定外の課金を防止
- APIキーの不正使用を監視

## 参考リンク
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Maps JavaScript API Reference](https://developers.google.com/maps/documentation/javascript/reference)
- [Places API Reference](https://developers.google.com/maps/documentation/places/web-service/overview)