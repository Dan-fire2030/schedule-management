'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'
import { Sidebar } from '@/components/layout/Sidebar'
import { TodaySchedule } from '@/components/dashboard/TodaySchedule'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function DashboardPage() {
  const { isAuthenticated, loading, signOut, user, profile } = useAuthSimplified()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pastel-pink via-white to-pastel-blue flex items-center justify-center">
        <LoadingSpinner message="読み込み中..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Sidebar>
      <TodaySchedule />
    </Sidebar>
  )
}