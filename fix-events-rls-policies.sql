-- Events テーブルの不足しているRLSポリシーを追加
-- Supabase SQL Editorで実行してください

-- 1. 現在のポリシーを確認（実行前）
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'events';

-- 2. 不足している可能性のあるポリシーを追加

-- DELETE用ポリシー（イベント作成者のみ削除可能）
CREATE POLICY "Event creators can delete their events" ON public.events
    FOR DELETE USING (created_by = auth.uid());

-- UPDATE用ポリシー（イベント作成者のみ更新可能）
CREATE POLICY "Event creators can update their events" ON public.events
    FOR UPDATE USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- 3. event_participantsテーブルのポリシーも確認・追加
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- event_participantsの閲覧ポリシー
CREATE POLICY "Event viewers can view participants" ON public.event_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events
            JOIN public.group_members ON group_members.group_id = events.group_id
            WHERE events.id = event_participants.event_id
            AND group_members.user_id = auth.uid()
        )
    );

-- event_participantsの管理ポリシー（自分の参加状況のみ）
CREATE POLICY "Group members can manage their participation" ON public.event_participants
    FOR ALL USING (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.events
            JOIN public.group_members ON group_members.group_id = events.group_id
            WHERE events.id = event_participants.event_id
            AND group_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.events
            JOIN public.group_members ON group_members.group_id = events.group_id
            WHERE events.id = event_participants.event_id
            AND group_members.user_id = auth.uid()
        )
    );

-- 4. 完了後の確認（実行後）
SELECT 
    tablename,
    policyname, 
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('events', 'event_participants')
ORDER BY tablename, cmd;

-- 5. 期待される結果
-- eventsテーブルには以下のポリシーが必要:
-- - SELECT用: "Group members can view events" または類似
-- - INSERT用: "Group members can create events" または類似  
-- - UPDATE用: "Event creators can update their events"
-- - DELETE用: "Event creators can delete their events"

-- 6. ポリシーが重複している場合のエラー対処
-- もしポリシーが既に存在するエラーが出た場合は、以下で削除してから再実行:
-- DROP POLICY IF EXISTS "Event creators can delete their events" ON public.events;
-- DROP POLICY IF EXISTS "Event creators can update their events" ON public.events;