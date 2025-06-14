'use client'

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

// Request permission for push notifications
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported')
  }

  return await Notification.requestPermission()
}

// Get current permission status
export function getNotificationPermission(): NotificationPermission {
  if (!isPushSupported()) {
    return 'denied'
  }

  return Notification.permission
}

// Register service worker for push notifications
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    return registration
  } catch (error) {
    return null
  }
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported')
  }

  const permission = await requestNotificationPermission()
  if (permission !== 'granted') {
    throw new Error('Push notification permission denied')
  }

  const registration = await registerServiceWorker()
  if (!registration) {
    throw new Error('Service Worker registration failed')
  }

  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    })

    return subscription
  } catch (error) {
    return null
  }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      await subscription.unsubscribe()
      return true
    }
    
    return false
  } catch (error) {
    return false
  }
}

// Show local notification
export async function showLocalNotification(payload: PushNotificationPayload): Promise<void> {
  if (!isPushSupported()) {
    throw new Error('Notifications are not supported')
  }

  const permission = getNotificationPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission not granted')
  }

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
      tag: payload.tag,
      data: payload.data,
      requireInteraction: true
    })
  } catch (error) {
    // Fallback to browser notification if service worker fails
    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      tag: payload.tag,
      data: payload.data
    })
  }
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Save subscription to server
export async function saveSubscriptionToServer(subscription: PushSubscription): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    })

    return response.ok
  } catch (error) {
    return false
  }
}

// Remove subscription from server
export async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    })

    return response.ok
  } catch (error) {
    return false
  }
}