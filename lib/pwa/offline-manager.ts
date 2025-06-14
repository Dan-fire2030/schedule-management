'use client'

export interface OfflineData {
  id: string
  type: 'event' | 'reminder' | 'group' | 'message'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  userId: string
}

class OfflineManager {
  private readonly STORAGE_KEY = 'schemanager-offline-data'
  private readonly MAX_OFFLINE_ITEMS = 100
  private onlineListeners: Array<(isOnline: boolean) => void> = []
  private syncListeners: Array<(syncCount: number) => void> = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners()
    }
  }

  private setupEventListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
this.notifyOnlineListeners(true)
      this.syncOfflineData()
    })

    window.addEventListener('offline', () => {
this.notifyOnlineListeners(false)
    })

    // Listen for visibility change to check connection
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        this.syncOfflineData()
      }
    })
  }

  // Check if currently online
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  // Store data for offline sync
  storeOfflineData(data: Omit<OfflineData, 'id' | 'timestamp'>): void {
    if (typeof window === 'undefined') return

    const offlineItem: OfflineData = {
      ...data,
      id: this.generateId(),
      timestamp: Date.now()
    }

    const existingData = this.getOfflineData()
    const updatedData = [...existingData, offlineItem]

    // Keep only the most recent items to prevent storage overflow
    if (updatedData.length > this.MAX_OFFLINE_ITEMS) {
      updatedData.splice(0, updatedData.length - this.MAX_OFFLINE_ITEMS)
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedData))
}

  // Get all offline data
  getOfflineData(): OfflineData[] {
    if (typeof window === 'undefined') return []

    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
return []
    }
  }

  // Clear offline data
  clearOfflineData(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.STORAGE_KEY)
  }

  // Remove specific offline item
  removeOfflineItem(itemId: string): void {
    if (typeof window === 'undefined') return

    const offlineData = this.getOfflineData()
    const filteredData = offlineData.filter(item => item.id !== itemId)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredData))
  }

  // Sync offline data when back online
  async syncOfflineData(): Promise<void> {
    if (!this.isOnline()) {
return
    }

    const offlineData = this.getOfflineData()
    if (offlineData.length === 0) {
return
    }
let syncedCount = 0

    for (const item of offlineData) {
      try {
        const success = await this.syncSingleItem(item)
        if (success) {
          this.removeOfflineItem(item.id)
          syncedCount++
        }
      } catch (error) {
// Continue with next item
      }
    }
this.notifySyncListeners(syncedCount)
  }

  // Sync a single offline item
  private async syncSingleItem(item: OfflineData): Promise<boolean> {
    try {
      // This would be implemented based on your specific API endpoints
      const endpoint = this.getEndpointForItem(item)
      const method = this.getMethodForAction(item.action)

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: item.action !== 'delete' ? JSON.stringify(item.data) : undefined
      })

      return response.ok
    } catch (error) {
return false
    }
  }

  private getEndpointForItem(item: OfflineData): string {
    switch (item.type) {
      case 'event':
        return `/api/events${item.action === 'create' ? '' : `/${item.data.id}`}`
      case 'reminder':
        return `/api/reminders${item.action === 'create' ? '' : `/${item.data.id}`}`
      case 'group':
        return `/api/groups${item.action === 'create' ? '' : `/${item.data.id}`}`
      case 'message':
        return `/api/messages${item.action === 'create' ? '' : `/${item.data.id}`}`
      default:
        throw new Error(`Unknown item type: ${item.type}`)
    }
  }

  private getMethodForAction(action: OfflineData['action']): string {
    switch (action) {
      case 'create':
        return 'POST'
      case 'update':
        return 'PUT'
      case 'delete':
        return 'DELETE'
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  }

  private generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Subscribe to online status changes
  onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.onlineListeners.push(callback)
    
    // Call immediately with current status
    callback(this.isOnline())
    
    return () => {
      this.onlineListeners = this.onlineListeners.filter(cb => cb !== callback)
    }
  }

  // Subscribe to sync completion
  onSyncComplete(callback: (syncCount: number) => void): () => void {
    this.syncListeners.push(callback)
    
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback)
    }
  }

  private notifyOnlineListeners(isOnline: boolean) {
    this.onlineListeners.forEach(callback => callback(isOnline))
  }

  private notifySyncListeners(syncCount: number) {
    this.syncListeners.forEach(callback => callback(syncCount))
  }

  // Get offline data count
  getOfflineDataCount(): number {
    return this.getOfflineData().length
  }

  // Check if there's pending offline data
  hasPendingData(): boolean {
    return this.getOfflineDataCount() > 0
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager()

// React hook for offline management
export function useOffline() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingSync, setPendingSync] = useState(0)

  useEffect(() => {
    setPendingSync(offlineManager.getOfflineDataCount())
    
    const unsubscribeOnline = offlineManager.onOnlineStatusChange(setIsOnline)
    const unsubscribeSync = offlineManager.onSyncComplete((count) => {
      setPendingSync(offlineManager.getOfflineDataCount())
    })
    
    return () => {
      unsubscribeOnline()
      unsubscribeSync()
    }
  }, [])

  return {
    isOnline,
    pendingSync,
    syncOfflineData: () => offlineManager.syncOfflineData(),
    clearOfflineData: () => {
      offlineManager.clearOfflineData()
      setPendingSync(0)
    }
  }
}

// Import React hooks
import { useState, useEffect } from 'react'