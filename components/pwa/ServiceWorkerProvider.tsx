'use client'

import { useEffect } from 'react'

export function ServiceWorkerProvider() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Service Worker registered successfully
        })
        .catch((registrationError) => {
          // Service Worker registration failed
        })
    }
  }, [])

  return null
}