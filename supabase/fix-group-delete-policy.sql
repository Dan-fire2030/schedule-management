-- グループテーブルのDELETEポリシーを修正

-- 既存のDELETEポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "グループ作成者は削除可能" ON groups;

-- 新しいDELETEポリシーを作成
CREATE POLICY "グループ作成者は削除可能" ON groups
FOR DELETE 
TO authenticated
USING (
  auth.uid() = created_by
);

-- 外部キー制約をカスケード削除に設定（存在しない場合）
-- グループが削除されたときに関連データも削除されるようにする

-- group_membersテーブル
ALTER TABLE group_members
DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;

ALTER TABLE group_members
ADD CONSTRAINT group_members_group_id_fkey
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- group_invitationsテーブル
ALTER TABLE group_invitations
DROP CONSTRAINT IF EXISTS group_invitations_group_id_fkey;

ALTER TABLE group_invitations
ADD CONSTRAINT group_invitations_group_id_fkey
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- eventsテーブル
ALTER TABLE events
DROP CONSTRAINT IF EXISTS events_group_id_fkey;

ALTER TABLE events
ADD CONSTRAINT events_group_id_fkey
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- messagesテーブル
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_group_id_fkey;

ALTER TABLE messages
ADD CONSTRAINT messages_group_id_fkey
FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- 確認のためのクエリ
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'groups' 
AND cmd = 'DELETE';