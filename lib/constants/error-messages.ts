export const ERROR_MESSAGES = {
  // 認証関連
  AUTH_FAILED: 'ユーザー認証に失敗しました',
  AUTH_TIMEOUT: '認証の初期化がタイムアウトしました',
  SESSION_GET_FAILED: 'セッション取得に失敗しました',
  SIGNIN_FAILED: 'サインインに失敗しました',
  SIGNUP_FAILED: 'アカウント作成に失敗しました',
  USERNAME_TAKEN: 'このユーザー名は既に使用されています',
  
  // ネットワーク関連
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  CONNECTION_FAILED: '接続に失敗しました',
  REALTIME_CONNECTION_FAILED: 'リアルタイム接続に失敗しました',
  
  // グループ関連
  GROUP_CREATE_FAILED: 'グループの作成に失敗しました',
  GROUP_UPDATE_FAILED: 'グループの更新に失敗しました',
  GROUP_DELETE_FAILED: 'グループの削除に失敗しました',
  GROUP_JOIN_FAILED: 'グループへの参加に失敗しました',
  GROUP_LOAD_FAILED: 'グループの読み込みに失敗しました',
  
  // イベント関連
  EVENT_CREATE_FAILED: 'イベントの作成に失敗しました',
  EVENT_UPDATE_FAILED: 'イベントの更新に失敗しました',
  EVENT_DELETE_FAILED: 'イベントの削除に失敗しました',
  EVENT_LOAD_FAILED: 'イベントの読み込みに失敗しました',
  
  // メッセージ関連
  MESSAGE_SEND_FAILED: 'メッセージの送信に失敗しました',
  MESSAGE_LOAD_FAILED: 'メッセージの読み込みに失敗しました',
  MESSAGE_UPDATE_FAILED: 'メッセージの更新に失敗しました',
  MESSAGE_DELETE_FAILED: 'メッセージの削除に失敗しました',
  
  // スタンプ関連
  STAMP_CREATE_FAILED: 'スタンプの作成に失敗しました',
  STAMP_LOAD_FAILED: 'スタンプの読み込みに失敗しました',
  
  // リマインダー関連
  REMINDER_CREATE_FAILED: 'リマインダーの作成に失敗しました',
  REMINDER_UPDATE_FAILED: 'リマインダーの更新に失敗しました',
  REMINDER_DELETE_FAILED: 'リマインダーの削除に失敗しました',
  REMINDER_LOAD_FAILED: 'リマインダーの読み込みに失敗しました',
  
  // ファイル関連
  FILE_UPLOAD_FAILED: 'ファイルのアップロードに失敗しました',
  FILE_SIZE_TOO_LARGE: 'ファイルサイズが大きすぎます',
  FILE_TYPE_NOT_SUPPORTED: 'サポートされていないファイル形式です',
  
  // 設定関連
  SETTINGS_SAVE_FAILED: '設定の保存に失敗しました',
  SETTINGS_LOAD_FAILED: '設定の読み込みに失敗しました',
  
  // 一般的なエラー
  UNEXPECTED_ERROR: '予期しないエラーが発生しました',
  PERMISSION_DENIED: '権限がありません',
  NOT_FOUND: '要求されたリソースが見つかりません',
  VALIDATION_ERROR: '入力内容に問題があります',
  
  // Supabase関連
  SUPABASE_CONFIG_MISSING: 'Supabase設定が不完全です',
  DATABASE_ERROR: 'データベースエラーが発生しました',
  
  // PWA関連
  OFFLINE_ERROR: 'オフライン状態のため処理できません',
  INSTALL_FAILED: 'アプリのインストールに失敗しました',
  
  // 位置情報関連
  LOCATION_PERMISSION_DENIED: '位置情報の権限が拒否されました',
  LOCATION_GET_FAILED: '位置情報の取得に失敗しました',
  
  // 通知関連
  NOTIFICATION_PERMISSION_DENIED: '通知の権限が拒否されました',
  NOTIFICATION_SEND_FAILED: '通知の送信に失敗しました',
} as const

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES