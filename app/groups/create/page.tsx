'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'
import { Sidebar } from '@/components/layout/Sidebar'
import { CreateGroupForm } from '@/components/groups/CreateGroupForm'

export default function CreateGroupPage() {
  const { isAuthenticated, loading } = useAuthSimplified()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const handleSuccess = (groupId: string) => {
    router.push(`/groups/${groupId}`)
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <Sidebar>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary-600 mb-2">
            新しいグループを作成
          </h1>
          <p className="text-gray-600">
            友達や家族と一緒に予定を管理するグループを作成しましょう
          </p>
        </div>

        <CreateGroupForm 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </Sidebar>
  )
}