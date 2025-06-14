'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { usePWAInstall } from '@/lib/pwa/install-prompt'
import { 
  Download, 
  Smartphone, 
  X, 
  ExternalLink,
  CheckCircle,
  Info
} from 'lucide-react'

interface PWAInstallPromptProps {
  className?: string
  showAsCard?: boolean
  autoShow?: boolean
}

export function PWAInstallPrompt({ 
  className = '', 
  showAsCard = true,
  autoShow = true
}: PWAInstallPromptProps) {
  const { canInstall, isInstalled, install, getInstallInstructions, getStoreUrl } = usePWAInstall()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  // Check if prompt was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    setIsDismissed(dismissed === 'true')
  }, [])

  // Show prompt when install becomes available
  useEffect(() => {
    if (autoShow && canInstall && !isDismissed && !isInstalled) {
      const timer = setTimeout(() => setIsVisible(true), 2000) // Show after 2 seconds
      return () => clearTimeout(timer)
    }
  }, [canInstall, isDismissed, isInstalled, autoShow])

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      const success = await install()
      if (success) {
        setIsVisible(false)
      }
    } catch (error) {
} finally {
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    localStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  const instructions = getInstallInstructions()
  const storeUrl = getStoreUrl()

  // Don't show if already installed or dismissed
  if (isInstalled || (!canInstall && !isVisible)) {
    return null
  }

  // Manual install instructions for browsers that don't support auto-prompt
  if (!canInstall && isVisible) {
    const content = (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              アプリをインストール - {instructions.platform}
            </h3>
            <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              {instructions.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  {instruction}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {storeUrl && (
          <Button
            variant="outline"
            onClick={() => window.open(storeUrl, '_blank')}
            className="w-full flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            ストアからダウンロード
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={handleDismiss}
          className="w-full text-gray-500 dark:text-gray-400"
        >
          後で
        </Button>
      </div>
    )

    return showAsCard ? (
      <Card className={`p-4 ${className}`}>
        {content}
      </Card>
    ) : (
      <div className={className}>
        {content}
      </div>
    )
  }

  // Auto-install prompt for supported browsers
  if (!canInstall || !isVisible) {
    return null
  }

  const content = (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full flex items-center justify-center flex-shrink-0">
          <Smartphone className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
            スケマネをインストール
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ホーム画面に追加して、よりアプリらしく快適に使用できます
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={handleInstall}
          isLoading={isInstalling}
          className="flex-1 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          インストール
        </Button>
        <Button
          variant="outline"
          onClick={handleDismiss}
          disabled={isInstalling}
          className="px-4"
        >
          後で
        </Button>
      </div>
    </div>
  )

  return showAsCard ? (
    <Card className={`p-4 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/10 ${className}`}>
      {content}
    </Card>
  ) : (
    <div className={className}>
      {content}
    </div>
  )
}

// Compact install button component
export function PWAInstallButton({ className = '' }: { className?: string }) {
  const { canInstall, isInstalled, install } = usePWAInstall()
  const [isInstalling, setIsInstalling] = useState(false)

  if (isInstalled || !canInstall) {
    return null
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      await install()
    } catch (error) {
} finally {
      setIsInstalling(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleInstall}
      isLoading={isInstalling}
      className={`flex items-center gap-2 ${className}`}
    >
      <Download className="w-4 h-4" />
      アプリをインストール
    </Button>
  )
}

// Status indicator component
export function PWAStatusIndicator({ className = '' }: { className?: string }) {
  const { isInstalled } = usePWAInstall()

  if (!isInstalled) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 text-green-600 dark:text-green-400 ${className}`}>
      <CheckCircle className="w-4 h-4" />
      <span className="text-sm font-medium">アプリとしてインストール済み</span>
    </div>
  )
}