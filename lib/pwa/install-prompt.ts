'use client'

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

class PWAInstallManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null
  private installListeners: Array<(canInstall: boolean) => void> = []
  private installedListeners: Array<() => void> = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners()
    }
  }

  private setupEventListeners() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
e.preventDefault()
      this.deferredPrompt = e as BeforeInstallPromptEvent
      this.notifyInstallListeners(true)
    })

    // Listen for appinstalled event
    window.addEventListener('appinstalled', () => {
this.deferredPrompt = null
      this.notifyInstalledListeners()
      this.notifyInstallListeners(false)
    })

    // Check if running in standalone mode
    window.addEventListener('DOMContentLoaded', () => {
      if (this.isInstalled()) {
        this.notifyInstalledListeners()
      }
    })
  }

  // Check if PWA is already installed
  isInstalled(): boolean {
    if (typeof window === 'undefined') return false
    
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    )
  }

  // Check if PWA can be installed
  canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isInstalled()
  }

  // Trigger install prompt
  async install(): Promise<boolean> {
    if (!this.deferredPrompt) {
return false
    }

    try {
      await this.deferredPrompt.prompt()
      const choiceResult = await this.deferredPrompt.userChoice
      
      if (choiceResult.outcome === 'accepted') {
return true
      } else {
return false
      }
    } catch (error) {
return false
    } finally {
      this.deferredPrompt = null
      this.notifyInstallListeners(false)
    }
  }

  // Get installation instructions for different platforms
  getInstallInstructions(): { platform: string; instructions: string[] } {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        platform: 'Chrome',
        instructions: [
          'アドレスバーの右側の「インストール」ボタンをクリック',
          'または、メニュー（⋮）→「スケマネをインストール」を選択'
        ]
      }
    } else if (userAgent.includes('firefox')) {
      return {
        platform: 'Firefox',
        instructions: [
          'アドレスバーのホームアイコンをクリック',
          'または、メニュー（☰）→「このサイトをインストール」を選択'
        ]
      }
    } else if (userAgent.includes('safari')) {
      return {
        platform: 'Safari',
        instructions: [
          '共有ボタン（□↑）をタップ',
          '「ホーム画面に追加」を選択',
          'アプリ名を確認して「追加」をタップ'
        ]
      }
    } else if (userAgent.includes('edg')) {
      return {
        platform: 'Edge',
        instructions: [
          'アドレスバーの右側の「インストール」ボタンをクリック',
          'または、メニュー（⋯）→「アプリ」→「このサイトをアプリとしてインストール」を選択'
        ]
      }
    } else {
      return {
        platform: 'ブラウザ',
        instructions: [
          'ブラウザのメニューから「ホーム画面に追加」または「インストール」を探してください',
          'ブックマークに追加して簡単にアクセスできます'
        ]
      }
    }
  }

  // Subscribe to install availability changes
  onInstallAvailable(callback: (canInstall: boolean) => void): () => void {
    this.installListeners.push(callback)
    
    // Call immediately with current state
    callback(this.canInstall())
    
    // Return unsubscribe function
    return () => {
      this.installListeners = this.installListeners.filter(cb => cb !== callback)
    }
  }

  // Subscribe to install completion
  onInstalled(callback: () => void): () => void {
    this.installedListeners.push(callback)
    
    // Call immediately if already installed
    if (this.isInstalled()) {
      callback()
    }
    
    // Return unsubscribe function
    return () => {
      this.installedListeners = this.installedListeners.filter(cb => cb !== callback)
    }
  }

  private notifyInstallListeners(canInstall: boolean) {
    this.installListeners.forEach(callback => callback(canInstall))
  }

  private notifyInstalledListeners() {
    this.installedListeners.forEach(callback => callback())
  }

  // Get platform-specific app store badge URL
  getStoreUrl(): string | null {
    const userAgent = navigator.userAgent.toLowerCase()
    
    if (userAgent.includes('android')) {
      // Return Google Play Store URL when available
      return null // 'https://play.google.com/store/apps/details?id=com.schemanager.app'
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      // Return App Store URL when available
      return null // 'https://apps.apple.com/app/schemanager/id123456789'
    }
    
    return null
  }
}

// Export singleton instance
export const pwaInstaller = new PWAInstallManager()

// React hook for PWA install management
export function usePWAInstall() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    setIsInstalled(pwaInstaller.isInstalled())
    
    const unsubscribeInstall = pwaInstaller.onInstallAvailable(setCanInstall)
    const unsubscribeInstalled = pwaInstaller.onInstalled(() => setIsInstalled(true))
    
    return () => {
      unsubscribeInstall()
      unsubscribeInstalled()
    }
  }, [])

  return {
    canInstall,
    isInstalled,
    install: () => pwaInstaller.install(),
    getInstallInstructions: () => pwaInstaller.getInstallInstructions(),
    getStoreUrl: () => pwaInstaller.getStoreUrl()
  }
}

// Import useState and useEffect
import { useState, useEffect } from 'react'