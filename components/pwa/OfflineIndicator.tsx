'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useOffline } from '@/lib/pwa/offline-manager'
import { 
  WifiOff, 
  Wifi, 
  CloudOff, 
  Cloud, 
  RefreshCw, 
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface OfflineIndicatorProps {
  className?: string
  showDetails?: boolean
}

export function OfflineIndicator({ 
  className = '', 
  showDetails = false 
}: OfflineIndicatorProps) {
  const { isOnline, pendingSync, syncOfflineData, clearOfflineData } = useOffline()
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await syncOfflineData()
    } catch (error) {
} finally {
      setIsSyncing(false)
    }
  }

  const handleClearOfflineData = () => {
    if (confirm('オフライン中に保存されたデータを削除しますか？この操作は取り消せません。')) {
      clearOfflineData()
    }
  }

  // Compact indicator for header/nav
  if (!showDetails) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isOnline ? (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <Wifi className="w-4 h-4" />
            {pendingSync > 0 && (
              <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full">
                {pendingSync}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <WifiOff className="w-4 h-4" />
            {pendingSync > 0 && (
              <span className="text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full">
                {pendingSync}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  // Detailed offline status panel
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <>
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Cloud className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">
                    オンライン
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    インターネットに接続されています
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                  <CloudOff className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">
                    オフライン
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    インターネット接続がありません
                  </p>
                </div>
              </>
            )}
          </div>
          
          <div className={`w-3 h-3 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          } animate-pulse`} />
        </div>

        {/* Pending Sync Status */}
        {pendingSync > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                同期待ちのデータ: {pendingSync}件
              </span>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              オフライン中に変更されたデータがあります。
              インターネット接続が復旧すると自動的に同期されます。
            </div>

            {isOnline && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  isLoading={isSyncing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  今すぐ同期
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearOfflineData}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                  データを削除
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {isOnline && pendingSync === 0 && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">すべてのデータが同期されています</span>
          </div>
        )}

        {/* Offline Warning */}
        {!isOnline && (
          <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-700 dark:text-orange-300">
              <p className="font-medium mb-1">オフラインモード</p>
              <p>
                現在、一部の機能が制限されています。
                変更内容は接続が復旧すると自動的に同期されます。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Simple offline badge for quick status display
export function OfflineBadge({ className = '' }: { className?: string }) {
  const { isOnline, pendingSync } = useOffline()

  if (isOnline && pendingSync === 0) {
    return null
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      isOnline 
        ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
        : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
    } ${className}`}>
      {isOnline ? (
        <>
          <Clock className="w-3 h-3" />
          同期待ち {pendingSync}
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          オフライン
        </>
      )}
    </div>
  )
}