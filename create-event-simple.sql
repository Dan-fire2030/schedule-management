-- 簡略化されたイベント作成RPC関数
-- 必要最小限のフィールドのみでイベントを作成

-- 既存の関数を削除
DROP FUNCTION IF EXISTS create_event_simple;

-- 簡略化されたRPC関数を作成
CREATE OR REPLACE FUNCTION create_event_simple(
  p_group_id UUID,
  p_title TEXT,
  p_start_time TIMESTAMPTZ,
  p_description TEXT DEFAULT NULL,
  p_event_type TEXT DEFAULT 'single',
  p_end_time TIMESTAMPTZ DEFAULT NULL,
  p_location_name TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_event_id UUID;
  v_result JSON;
BEGIN
  -- 現在のユーザーIDを取得
  v_user_id := auth.uid();
  
  -- ユーザーが認証されているか確認
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'ユーザーが認証されていません';
  END IF;
  
  -- イベントを作成（最小限のフィールドのみ）
  INSERT INTO public.events (
    group_id,
    created_by,
    title,
    description,
    event_type,
    start_time,
    end_time,
    location_name
  ) VALUES (
    p_group_id,
    v_user_id,
    p_title,
    p_description,
    p_event_type,
    p_start_time,
    p_end_time,
    p_location_name
  ) RETURNING id INTO v_event_id;
  
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
  
  -- 作成されたイベントの情報をJSONで返す
  SELECT row_to_json(e.*) INTO v_result
  FROM public.events e
  WHERE e.id = v_event_id;
  
  RETURN v_result;
END;
$$;

-- 権限を付与
GRANT EXECUTE ON FUNCTION create_event_simple TO authenticated;

-- テスト用のクエリ
/*
SELECT create_event_simple(
  p_group_id := 'your-group-id-here',
  p_title := 'テストイベント',
  p_start_time := NOW() + INTERVAL '1 day',
  p_description := '簡単なテスト',
  p_event_type := 'single'
);
*/