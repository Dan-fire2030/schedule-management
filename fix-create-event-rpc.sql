-- 修正版: イベント作成用のRPC関数
-- Supabase SQL Editorで実行してください

-- 既存の関数を削除
DROP FUNCTION IF EXISTS create_event_rpc;

-- 修正版のRPC関数を作成
CREATE OR REPLACE FUNCTION create_event_rpc(
  p_group_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_type TEXT,
  p_start_date DATE,
  p_end_date DATE DEFAULT NULL,
  p_start_time TIME DEFAULT NULL,
  p_end_time TIME DEFAULT NULL,
  p_is_all_day BOOLEAN DEFAULT false,
  p_location JSONB DEFAULT NULL,
  p_max_participants INTEGER DEFAULT NULL,
  p_allow_maybe BOOLEAN DEFAULT true,
  p_require_response BOOLEAN DEFAULT false,
  p_priority TEXT DEFAULT 'medium'
)
RETURNS TABLE (
  id UUID,
  group_id UUID,
  title TEXT,
  type TEXT,
  start_date DATE,
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
  
  -- ユーザーがグループのメンバーか確認
  IF NOT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = p_group_id 
    AND gm.user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'You are not a member of this group';
  END IF;
  
  -- イベントを作成
  INSERT INTO public.events (
    group_id,
    title,
    description,
    type,
    status,
    priority,
    start_date,
    end_date,
    start_time,
    end_time,
    is_all_day,
    location,
    max_participants,
    allow_maybe,
    require_response,
    created_by
  ) VALUES (
    p_group_id,
    p_title,
    p_description,
    p_type,
    'published',
    p_priority,
    p_start_date,
    p_end_date,
    p_start_time,
    p_end_time,
    p_is_all_day,
    p_location,
    p_max_participants,
    p_allow_maybe,
    p_require_response,
    v_user_id
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
    e.type,
    e.start_date,
    e.created_at
  FROM public.events e
  WHERE e.id = v_event_id;
END;
$$;

-- 権限を付与
GRANT EXECUTE ON FUNCTION create_event_rpc TO authenticated;

-- テスト用のクエリ（グループIDを実際のものに置き換えてください）
/*
SELECT * FROM create_event_rpc(
  p_group_id := 'your-group-id-here',
  p_title := 'RPC経由のテストイベント',
  p_description := 'RPC関数で作成したテストイベント',
  p_type := 'single',
  p_start_date := CURRENT_DATE,
  p_is_all_day := false
);
*/