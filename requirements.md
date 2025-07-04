# スケマネ - 要件定義書

## 1. プロジェクト概要

### 1.1 アプリケーション名
スケマネ（Schedule Management）

### 1.2 コンセプト
友達や家族と共有できる予定管理アプリケーション。夢の世界のような幻想的で楽しいUI/UXを提供し、特にチャット機能を中心とした使いやすいコミュニケーションツール。

### 1.3 ターゲットユーザー
- 年齢層：10代〜50代
- 利用シーン：友達との遊びの計画、イベントの企画・管理

## 2. 機能要件

### 2.1 認証機能
- **ユーザー名認証**：シンプルなユーザー名での登録・ログイン
- **Google認証**：Googleアカウントでのログイン対応
- **プロフィール機能**：
  - ニックネーム設定
  - アイコン設定

### 2.2 グループ管理機能
- **複数グループ対応**：1人が複数のグループに所属可能
- **グループ作成**：誰でもグループを作成可能
- **メンバー招待**：QRコードによる招待機能
- **グループ人数制限**：最大12人まで
- **権限管理**：特別な管理者権限なし（全員が同等の権限）

### 2.3 予定管理機能
- **予定の種類**：
  - 単発イベント
  - 終日イベント
  - 定期的な予定
  - タスク・ToDo
- **予定の作成・編集**：グループメンバー全員が作成・編集可能
- **参加表明機能**：参加/不参加/未定の3段階
- **場所情報**：Google Maps連携による位置情報の追加
- **リマインダー機能**：
  - 複数の通知タイミング設定可能（5分前、15分前、30分前、1時間前、1日前など）
  - カスタム通知時間の設定

### 2.4 チャット機能（メイン機能）
- **リアルタイム同期**：メッセージの即時反映
- **メッセージ形式**：
  - テキストメッセージ
  - スタンプ（プリセット + カスタムスタンプ）
- **既読機能**：メッセージの既読状態表示
- **編集機能**：送信済みメッセージの編集可能
- **履歴保持期間**：1ヶ月間
- **UI/UX重視**：特に力を入れて設計

### 2.5 その他の機能
- **PWA対応**：アプリライクな体験の提供
- **オフライン対応**：適切なキャッシュ戦略の実装
- **ダークモード**：ライト/ダークテーマの切り替え

## 3. 非機能要件

### 3.1 パフォーマンス要件
- アニメーションを多用しながらも軽快な動作を維持
- リアルタイム同期の遅延を最小限に抑える
- モバイルデバイスでの快適な動作

### 3.2 デザイン要件
- **テーマ**：夢の世界（ディズニー風）の幻想的なデザイン
- **カラーパレット**：パステルカラーを基調
- **レスポンシブデザイン**：モバイルファースト設計、デスクトップ対応
- **アニメーション**：適度なアニメーションで楽しさを演出

### 3.3 セキュリティ要件
- 認証情報の安全な管理
- グループ間のデータ分離
- チャット履歴の適切な管理と削除

## 4. 技術スタック

### 4.1 フロントエンド
- **フレームワーク**：Next.js（App Router）
- **言語**：TypeScript
- **スタイリング**：Tailwind CSS
- **状態管理**：Context API / Zustand
- **アニメーション**：Framer Motion

### 4.2 バックエンド
- **BaaS**：Supabase
  - 認証機能
  - リアルタイムデータベース
  - ストレージ（アイコン、カスタムスタンプ）

### 4.3 その他
- **地図API**：Google Maps API
- **プッシュ通知**：Web Push API
- **PWA**：next-pwa

## 5. データベース設計（概要）

### 5.1 主要テーブル
- **users**：ユーザー情報
- **groups**：グループ情報
- **group_members**：グループメンバーシップ
- **events**：予定・イベント情報
- **event_participants**：イベント参加者情報
- **messages**：チャットメッセージ
- **message_reads**：既読情報
- **stamps**：スタンプ情報
- **reminders**：リマインダー設定

## 6. 開発フェーズ

### Phase 1：基盤構築 ✅完了
1. プロジェクトセットアップ
2. Supabase設定とDB設計
3. 認証システム実装
4. 基本的なUIコンポーネント作成

### Phase 2：コア機能開発
1. グループ管理機能
   - 基本的なグループ作成・一覧表示 ✅完了
   - グループ招待機能（QRコード優先実装）
     - 有効期限：7日間
     - 未登録ユーザーは登録画面へ誘導
   - グループ詳細ページ
     - メンバー一覧（カード形式）
     - グループ設定編集（モーダル形式）
     - 定期スケジュール表示（カレンダー形式）
2. 予定管理機能
3. カレンダーUI

### Phase 3：チャット機能開発
1. リアルタイムチャット実装
2. スタンプ機能
3. 既読・編集機能

### Phase 4：付加機能開発
1. リマインダー機能
2. 地図連携
3. PWA対応
4. ダークモード

### Phase 5：最終調整
1. パフォーマンス最適化
2. UI/UXブラッシュアップ
3. テスト・デバッグ

## 7. 成功指標
- ユーザーが直感的に操作できるUI
- チャット機能の快適な使用感
- グループでの予定調整がスムーズに行える
- 楽しく幻想的な雰囲気でユーザーを魅了する