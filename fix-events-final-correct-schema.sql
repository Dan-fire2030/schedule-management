-- 実際のスキーマに合わせたイベント作成RPC関数
-- 実際のテーブル構造に基づいて修正

-- 既存の関数を削除
DROP FUNCTION IF EXISTS create_event_rpc;

-- 正しいスキーマに基づくRPC関数を作成
CREATE OR REPLACE FUNCTION create_event_rpc(
  p_group_id UUID,
  p_title TEXT,
  p_start_time TIMESTAMPTZ,
  p_description TEXT DEFAULT NULL,
  p_event_type TEXT DEFAULT 'single',
  p_end_time TIMESTAMPTZ DEFAULT NULL,
  p_location_name TEXT DEFAULT NULL,
  p_location_lat NUMERIC DEFAULT NULL,
  p_location_lng NUMERIC DEFAULT NULL,
  p_location JSONB DEFAULT NULL,
  p_recurrence_rule TEXT DEFAULT NULL,
  p_allow_maybe BOOLEAN DEFAULT true,
  p_require_response BOOLEAN DEFAULT false,
  p_max_participants INTEGER DEFAULT NULL,
  p_timezone TEXT DEFAULT 'Asia/Tokyo'
)
RETURNS TABLE (
  id UUID,
  group_id UUID,
  title TEXT,
  event_type TEXT,
  start_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_event_id UUID;
BEGIN
  -- 現在のユーザーIDを取得
  v_user_id := auth.uid();
  
  -- ユーザーが認証されているか確認
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'ユーザーが認証されていません';
  END IF;
  
  -- ユーザーがグループのメンバーか確認
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = p_group_id 
    AND gm.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'このグループのメンバーではありません';
  END IF;
  
  -- イベントを作成（実際のテーブル構造に合わせて）
  INSERT INTO public.events (
    group_id,
    created_by,
    title,
    description,
    event_type,
    start_time,
    end_time,
    location_name,
    location_lat,
    location_lng,
    location,
    recurrence_rule,
    allow_maybe,
    require_response,
    max_participants,
    timezone
  ) VALUES (
    p_group_id,
    v_user_id,
    p_title,
    p_description,
    p_event_type,
    p_start_time,
    p_end_time,
    p_location_name,
    p_location_lat,
    p_location_lng,
    p_location,
    p_recurrence_rule,
    p_allow_maybe,
    p_require_response,
    p_max_participants,
    p_timezone
  ) RETURNING public.events.id INTO v_event_id;
  
  -- 作成者を参加者として追加
  INSERT INTO public.event_participants (
    event_id,
    user_id,
    status
  ) VALUES (
    v_event_id,
    v_user_id,
    'attending'
  );
  
  -- 結果を返す
  RETURN QUERY
  SELECT 
    e.id,
    e.group_id,
    e.title,
    e.event_type,
    e.start_time,
    e.created_at
  FROM public.events e
  WHERE e.id = v_event_id;
END;
$$;

-- 権限を付与
GRANT EXECUTE ON FUNCTION create_event_rpc TO authenticated;

-- テスト用のクエリ
/*
SELECT * FROM create_event_rpc(
  p_group_id := 'your-group-id-here',
  p_title := 'テストイベント',
  p_start_time := NOW() + INTERVAL '1 day',
  p_description := '実際のスキーマテスト',
  p_event_type := 'single'
);
*/