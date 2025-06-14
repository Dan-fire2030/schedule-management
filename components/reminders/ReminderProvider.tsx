'use client'

import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'
import { getReminderScheduler, cleanupReminderScheduler } from '@/lib/notifications/reminder-scheduler'

interface ReminderContextType {
  loadReminders: () => Promise<void>
  scheduler: ReturnType<typeof getReminderScheduler> | null
}

const ReminderContext = createContext<ReminderContextType>({
  loadReminders: async () => {},
  scheduler: null
})

export function useReminderContext() {
  return useContext(ReminderContext)
}

interface ReminderProviderProps {
  children: ReactNode
}

export function ReminderProvider({ children }: ReminderProviderProps) {
  const { user, isAuthenticated } = useAuthSimplified()

  const loadReminders = useCallback(async () => {
    if (!user || !isAuthenticated) return

    try {
      const scheduler = getReminderScheduler()
      await scheduler.loadAndScheduleReminders(user.id)
} catch (error) {
    // Silent error handling - reminder loading is optional
  }
  }, [user, isAuthenticated])

  useEffect(() => {
    if (isAuthenticated && user) {
      // ユーザーがログインしたらリマインダーを読み込み
      loadReminders()
    }

    // クリーンアップ
    return () => {
      if (!isAuthenticated) {
        cleanupReminderScheduler()
      }
    }
  }, [isAuthenticated, user, loadReminders])

  // ページを離れる時にクリーンアップ
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupReminderScheduler()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      cleanupReminderScheduler()
    }
  }, [])

  const contextValue: ReminderContextType = {
    loadReminders,
    scheduler: isAuthenticated ? getReminderScheduler() : null
  }

  return (
    <ReminderContext.Provider value={contextValue}>
      {children}
    </ReminderContext.Provider>
  )
}