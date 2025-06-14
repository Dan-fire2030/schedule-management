'use client'

import Image from 'next/image'
import { GroupMember } from '@/types/group'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface GroupMembersSectionProps {
  members: GroupMember[]
  currentUserId: string
  isAdmin: boolean
  onMembersUpdate?: () => void
}

export function GroupMembersSection({ 
  members, 
  currentUserId, 
  isAdmin,
  onMembersUpdate 
}: GroupMembersSectionProps) {
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'creator':
        return (
          <span className="px-2 py-1 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 text-xs rounded-full font-medium">
            作成者
          </span>
        )
      case 'admin':
        return (
          <span className="px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-xs rounded-full font-medium">
            管理者
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-soft p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">メンバー一覧</h2>
        <span className="text-sm text-gray-600">
          {members.length}人のメンバー
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-soft hover:shadow-md transition-all duration-300 p-6 relative overflow-hidden group"
          >
            {/* デコレーション */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100/20 to-accent-100/20 rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-500" />
            
            <div className="relative">
              {/* アバター */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-medium shadow-soft">
                    {member.profile?.avatar_url ? (
                      <Image 
                        src={member.profile.avatar_url} 
                        alt={member.profile.nickname || 'User'}
                        width={80}
                        height={80}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      member.profile?.nickname?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  {member.user_id === currentUserId && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-3 border-white rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* ユーザー情報 */}
              <div className="text-center">
                <h3 className="font-semibold text-gray-800 text-lg mb-1">
                  {member.profile?.nickname || 'ユーザー'}
                </h3>
                {member.user_id === currentUserId && (
                  <p className="text-xs text-gray-500 mb-2">（あなた）</p>
                )}
                <div className="flex justify-center mb-3">
                  {getRoleBadge(member.role)}
                </div>
                <p className="text-sm text-gray-500">
                  <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {format(new Date(member.joined_at), 'yyyy/MM/dd', { locale: ja })}
                </p>
              </div>

              {/* アクション */}
              {isAdmin && member.user_id !== currentUserId && (
                <div className="mt-4 flex justify-center">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* メンバーが少ない場合の招待促進 */}
      {members.length < 12 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-100">
          <p className="text-sm text-gray-700 text-center">
            あと{12 - members.length}人まで招待できます！
            <br />
            <span className="text-xs text-gray-600">友達を招待して一緒に楽しもう</span>
          </p>
        </div>
      )}
    </div>
  )
}