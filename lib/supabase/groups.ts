import { createClient } from './client'
import { cache, createCacheKey, withCache } from '@/lib/cache'
import type { 
  Group, 
  CreateGroupInput, 
  GroupMember, 
  GroupInvitation, 
  GroupSummary 
} from '@/types/group'

export class GroupService {
  
  /**
   * 新しいグループを作成
   */
  static async createGroup(input: CreateGroupInput): Promise<{ group: Group; error?: string }> {
    try {
      const supabase = createClient()
      // 現在のユーザーID取得
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { group: {} as Group, error: 'ユーザー認証に失敗しました' }
      }

      // 画像アップロード処理（必要な場合）
      let iconImageUrl: string | undefined

      if (input.icon_type === 'image' && input.icon_image_file) {
        // ファイル名の生成（ユーザーIDを含めてセキュリティ向上）
        const fileExt = input.icon_image_file.name.split('.').pop()?.toLowerCase()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        // ストレージバケットが存在するかチェック
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
        if (bucketsError) {
          throw bucketsError
        }

        const groupIconsBucket = buckets?.find(bucket => bucket.id === 'group-icons')
        if (!groupIconsBucket) {
          // 代替策：avatarsバケットを使用するか、画像アップロードをスキップ
          const fallbackBucket = buckets?.find(bucket => bucket.id === 'avatars')
          if (fallbackBucket) {
            // avatarsバケットにアップロード
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, input.icon_image_file, {
                cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
              // 画像なしで続行
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(uploadData.path)
              iconImageUrl = publicUrl
            }
          } else {
            // 画像アップロードをスキップして続行
          }
        } else {
          // 正常なgroup-iconsバケットが存在する場合
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('group-icons')
            .upload(fileName, input.icon_image_file, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            return { group: {} as Group, error: `アイコン画像のアップロードに失敗しました: ${uploadError.message}` }
          }
          // パブリックURLの取得
          const { data: { publicUrl } } = supabase.storage
            .from('group-icons')
            .getPublicUrl(uploadData.path)
          iconImageUrl = publicUrl
        }
      }

      // 招待コードを生成
      const inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

      // グループ作成データを準備
      const groupData = {
        name: input.name.trim(),
        description: input.description?.trim() || null,
        invite_code: inviteCode,
        icon_type: input.icon_type,
        icon_emoji: input.icon_type === 'emoji' ? input.icon_emoji : null,
        icon_image_url: input.icon_type === 'image' ? iconImageUrl : null,
        theme_color: input.theme_color || 'primary',
        recurring_schedule: input.recurring_schedule || null,
        created_by: user.id,
        settings: {
          allow_member_invite: true,
          allow_member_edit: true,
          message_retention_days: 30,
          notification_enabled: true
        }
      }

      // トランザクション的にグループとメンバーを作成
      // @ts-ignore - Supabase client type mismatch between server and client bindings
      const { data: groupResult, error: groupError } = await supabase
        .from('groups')
        .insert([groupData])
        .select('*')
        .single()

      if (groupError) {
        return { group: {} as Group, error: `グループの作成に失敗しました: ${groupError.message}` }
      }

      // 作成者をグループメンバーとして追加
      // @ts-ignore - Supabase client type mismatch between server and client bindings
      const { error: memberError } = await supabase
        .from('group_members')
        .insert([{
          group_id: groupResult.id,
          user_id: user.id,
          role: 'creator'
        }])

      if (memberError) {
        // グループは作成されたが、メンバー追加に失敗した場合はグループを削除
        // @ts-ignore - Supabase client type mismatch between server and client bindings
        await supabase.from('groups').delete().eq('id', groupResult.id)
        return { group: {} as Group, error: 'グループメンバーの追加に失敗しました' }
      }
      return { group: groupResult as Group }
    } catch (error) {
      return { group: {} as Group, error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * ユーザーが参加しているグループ一覧を取得
   */
  static async getUserGroups(): Promise<{ groups: GroupSummary[]; error?: string }> {
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { groups: [], error: 'ユーザー認証に失敗しました' }
      }

      const cacheKey = createCacheKey('user-groups', user.id)
      
      return await withCache(cacheKey, async () => {
        // @ts-ignore - Supabase client type mismatch between server and client bindings
        const { data, error } = await supabase
          .from('group_members')
          .select(`
            groups:group_id (
              id,
              name,
              icon_type,
              icon_emoji,
              icon_image_url,
              theme_color,
              member_count,
              updated_at
            )
          `)
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false })

        if (error) {
          // テーブルが存在しない場合は空配列を返す
          if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
            return { groups: [] };
          }
          
          return { groups: [], error: 'グループの取得に失敗しました' }
        }

        // groupsデータを抽出
        const groups = data?.map(item => item.groups).filter(Boolean).flat() || []
        return { groups: groups as GroupSummary[] }
      }, 2 * 60 * 1000) // 2分間キャッシュ
    } catch (error) {
      return { groups: [], error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * グループの詳細情報を取得
   */
  static async getGroup(groupId: string): Promise<{ group: Group | null; error?: string }> {
    try {
      const supabase = createClient()
      const cacheKey = createCacheKey('group', groupId)
      
      return await withCache(cacheKey, async () => {
        // まず、グループが存在するかどうかを確認
        // @ts-ignore - Supabase client type mismatch between server and client bindings
        const { data: allGroups, error: listError } = await supabase
          .from('groups')
          .select('id, name')
          .limit(100)
        
        if (listError) {
          throw listError
        }
        
        // @ts-ignore - Supabase client type mismatch between server and client bindings
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single()

        if (error) {
          // より安全なエラーログ出力
          try {
            // Safe error logging
          } catch (e) {
            // Ignore logging errors
          }
          
          // 他の機能に影響しないよう、nullを返してエラーメッセージを提供
          return { 
            group: null, 
            error: `グループ情報の取得に失敗しました (ID: ${groupId})` 
          }
        }

        return { group: data as Group }
      }, 5 * 60 * 1000) // 5分間キャッシュ
    } catch (error) {
      return { group: null, error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * グループのメンバー一覧を取得
   */
  static async getGroupMembers(groupId: string): Promise<{ members: GroupMember[]; error?: string }> {
    try {
      const supabase = createClient()
      const cacheKey = createCacheKey('group-members', groupId)
      
      return await withCache(cacheKey, async () => {
        // @ts-ignore - Supabase client type mismatch between server and client bindings
        const { data, error } = await supabase
          .from('group_members')
          .select(`
            *,
            profile:profiles(username, nickname, avatar_url)
          `)
          .eq('group_id', groupId)
          .order('joined_at', { ascending: true })

        if (error) {
          // より安全なエラーログ出力
          try {
            // Safe error logging
          } catch (e) {
            // Ignore logging errors
          }
          
          // 他の機能に影響しないよう、空配列を返してエラーメッセージを提供
          return { 
            members: [], 
            error: `メンバー情報の取得に失敗しました (GroupID: ${groupId})` 
          }
        }

        return { members: data as GroupMember[] }
      }, 3 * 60 * 1000) // 3分間キャッシュ
    } catch (error) {
      return { members: [], error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * グループ設定を更新
   */
  static async updateGroup(groupId: string, updates: Partial<Group>): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      // @ts-ignore - Supabase client type mismatch between server and client bindings
      const { error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', groupId)

      if (error) {
        return { success: false, error: 'グループの更新に失敗しました' }
      }

      // キャッシュを無効化
      cache.delete(createCacheKey('group', groupId))
      
      // ユーザーグループ一覧のキャッシュも無効化（更新が反映されるように）
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        cache.delete(createCacheKey('user-groups', user.id))
      }

      return { success: true }
    } catch (error) {
return { success: false, error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * メンバーをグループから削除
   */
  static async removeMember(groupId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      // @ts-ignore - Supabase client type mismatch between server and client bindings
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId)

      if (error) {
return { success: false, error: 'メンバーの削除に失敗しました' }
      }

      return { success: true }
    } catch (error) {
return { success: false, error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * グループから退出
   */
  static async leaveGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'ユーザー認証に失敗しました' }
      }

      return await this.removeMember(groupId, user.id)
    } catch (error) {
return { success: false, error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * グループを削除（作成者のみ）
   */
  static async deleteGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
// 現在のユーザー情報を取得
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
return { success: false, error: 'ユーザー認証に失敗しました' }
      }
// まず、グループの作成者か確認
      // @ts-ignore - Supabase client type mismatch between server and client bindings
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('created_by')
        .eq('id', groupId)
        .single()
        
      if (groupError) {
return { success: false, error: 'グループ情報の取得に失敗しました' }
      }
      
      if (groupData.created_by !== user.id) {
return { success: false, error: 'グループの作成者のみ削除できます' }
      }
      
      // グループを削除
      // @ts-ignore - Supabase client type mismatch between server and client bindings
      const { error, data } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)
        .select()

      if (error) {
return { success: false, error: `グループの削除に失敗しました: ${error.message}` }
      }
// キャッシュをクリア
      cache.delete(createCacheKey('group', groupId))
      if (user) {
        cache.delete(createCacheKey('user-groups', user.id))
      }

      return { success: true }
    } catch (error) {
return { success: false, error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * グループ招待を作成
   */
  static async createInvitation(
    groupId: string,
    inviteType: 'link' | 'qr' | 'username' = 'link',
    invitedUserId?: string,
    expiresAt?: Date
  ): Promise<{ invitation: GroupInvitation | null; error?: string }> {
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { invitation: null, error: 'ユーザー認証に失敗しました' }
      }

      // デフォルトで7日後の有効期限を設定
      const defaultExpiresAt = new Date()
      defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 7)
      
      const invitationData = {
        group_id: groupId,
        invited_by: user.id,
        invited_user_id: invitedUserId || null,
        invite_type: inviteType,
        expires_at: (expiresAt || defaultExpiresAt).toISOString()
      }

      // @ts-ignore - Supabase client type mismatch between server and client bindings
      const { data, error } = await supabase
        .from('group_invitations')
        .insert([invitationData])
        .select('*')
        .single()

      if (error) {
return { invitation: null, error: '招待の作成に失敗しました' }
      }

      return { invitation: data as GroupInvitation }
    } catch (error) {
return { invitation: null, error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * 招待への応答（承認/拒否）
   */
  static async respondToInvitation(
    invitationId: string,
    status: 'accepted' | 'declined'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { success: false, error: 'ユーザー認証に失敗しました' }
      }

      // まず招待情報を取得
      // @ts-ignore - Supabase client type mismatch between server and client bindings
      const { data: invitationData, error: fetchError } = await supabase
        .from('group_invitations')
        .select('*, groups(*)')
        .eq('id', invitationId)
        .single()

      if (fetchError || !invitationData) {
return { success: false, error: '招待が見つかりません' }
      }

      // 有効期限チェック
      if (new Date(invitationData.expires_at) < new Date()) {
        return { success: false, error: 'この招待は有効期限が切れています' }
      }

      // 既に使用済みかチェック
      if (invitationData.status !== 'pending') {
        return { success: false, error: 'この招待は既に使用されています' }
      }

      // 既にメンバーかチェック
      if (status === 'accepted') {
        // @ts-ignore - Supabase client type mismatch between server and client bindings
        const { data: existingMember } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', invitationData.group_id)
          .eq('user_id', user.id)
          .single()

        if (existingMember) {
          return { success: false, error: '既にこのグループのメンバーです' }
        }
      }

      // 招待の更新
      // @ts-ignore - Supabase client type mismatch between server and client bindings
      const { error: updateError } = await supabase
        .from('group_invitations')
        .update({
          status,
          responded_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      const invitation = invitationData

      if (updateError) {
return { success: false, error: '招待への応答に失敗しました' }
      }

      // 承認の場合はグループメンバーに追加
      if (status === 'accepted' && invitation) {
        // @ts-ignore - Supabase client type mismatch between server and client bindings
        const { error: memberError } = await supabase
          .from('group_members')
          .insert([{
            group_id: invitation.group_id,
            user_id: user.id,
            role: 'member'
          }])

        if (memberError) {
return { success: false, error: 'グループへの参加に失敗しました' }
        }
      }

      return { success: true }
    } catch (error) {
return { success: false, error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * ユーザーの招待一覧を取得
   */
  static async getUserInvitations(): Promise<{ invitations: GroupInvitation[]; error?: string }> {
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return { invitations: [], error: 'ユーザー認証に失敗しました' }
      }

      // @ts-ignore - Supabase client type mismatch between server and client bindings
      const { data, error } = await supabase
        .from('group_invitations')
        .select(`
          *,
          group:groups(name, icon_type, icon_emoji, icon_image_url, theme_color),
          inviter:profiles!invited_by(nickname, username, avatar_url)
        `)
        .eq('invited_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
return { invitations: [], error: '招待の取得に失敗しました' }
      }

      return { invitations: data as GroupInvitation[] }
    } catch (error) {
return { invitations: [], error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * グループの招待一覧を取得（管理者用）
   */
  static async getGroupInvitations(groupId: string): Promise<{ invitations: GroupInvitation[]; error?: string }> {
    try {
      const supabase = createClient()
      // @ts-ignore - Supabase client type mismatch between server and client bindings
      const { data, error } = await supabase
        .from('group_invitations')
        .select(`
          *
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })

      if (error) {
return { invitations: [], error: '招待の取得に失敗しました' }
      }

      return { invitations: data as GroupInvitation[] }
    } catch (error) {
return { invitations: [], error: '予期しないエラーが発生しました' }
    }
  }

  /**
   * 期限切れの招待をチェック
   */
  static async checkExpiredInvitations(): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('check_invitation_expiry')

      if (error) {
        return { success: false, error: '期限切れ招待のチェックに失敗しました' }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: '予期しないエラーが発生しました' }
    }
  }
}

// エクスポート用の関数
export const createGroup = GroupService.createGroup.bind(GroupService)
export const getUserGroups = GroupService.getUserGroups.bind(GroupService)
export const getGroup = async (groupId: string) => {
  const { group } = await GroupService.getGroup(groupId)
  return group
}
export const getGroupMembers = async (groupId: string) => {
  const { members } = await GroupService.getGroupMembers(groupId)
  return members
}
export const updateGroup = GroupService.updateGroup.bind(GroupService)
export const removeMember = GroupService.removeMember.bind(GroupService)
export const leaveGroup = GroupService.leaveGroup.bind(GroupService)
export const deleteGroup = GroupService.deleteGroup.bind(GroupService)
export const createGroupInvitation = async (groupId: string) => {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7日後に期限切れ
  const { invitation, error } = await GroupService.createInvitation(groupId, 'link', undefined, expiresAt)
  if (error) throw new Error(error)
  return invitation
}
export const respondToGroupInvitation = async (invitationId: string, status: 'accepted' | 'declined') => {
  const { success, error } = await GroupService.respondToInvitation(invitationId, status)
  if (error) throw new Error(error)
  return success
}
export const getUserInvitations = GroupService.getUserInvitations.bind(GroupService)
export const getGroupInvitations = async (groupId: string) => {
  const { invitations } = await GroupService.getGroupInvitations(groupId)
  return invitations
}
export const checkExpiredInvitations = GroupService.checkExpiredInvitations.bind(GroupService)