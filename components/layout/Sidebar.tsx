'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuthSimplified } from '@/hooks/useAuthSimplified'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { PWAInstallButton, PWAStatusIndicator } from '@/components/pwa/PWAInstallPrompt'
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator'
import { backgrounds, spacing } from '@/lib/design-system/styles'
import { animations } from '@/lib/design-system/animations'

// Icons (you can replace these with your preferred icon library)
const HomeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ChatIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const GroupIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
)

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const BellIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5zm-5-8h10a2 2 0 002-2V5a2 2 0 00-2-2H10a2 2 0 00-2 2v2a2 2 0 002 2zm0 0V9a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2h-6a2 2 0 01-2-2V9z" />
  </svg>
)

const navigation = [
  { name: 'ホーム', href: '/dashboard', icon: HomeIcon },
  { name: 'グループ', href: '/groups', icon: GroupIcon },
  { name: 'カレンダー', href: '/calendar', icon: CalendarIcon },
  { name: 'チャット', href: '/chat', icon: ChatIcon },
  { name: 'リマインダー', href: '/reminders', icon: BellIcon },
]

interface SidebarProps {
  children: React.ReactNode
}

export function Sidebar({ children }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const { user, profile, signOut } = useAuthSimplified()

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)
  
  const handleLogout = async () => {
    await signOut()
  }

  return (
    <div className={`flex h-screen ${backgrounds.magic} transition-colors duration-300`}>
      {/* Mobile menu button */}
      <button
        className="fixed bottom-6 right-6 z-50 p-4 bg-primary-500 text-white rounded-full shadow-md md:hidden hover:scale-110 active:scale-90 transition-transform"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      {/* Desktop Sidebar - Always visible */}
      <aside className="hidden md:flex md:flex-col w-72 bg-white dark:bg-gray-800 shadow-lg border-r border-primary-100 dark:border-gray-700 transition-colors duration-300">
        {/* Logo/Header */}
        <div className="p-6 border-b border-primary-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                スケマネ
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">魔法のスケジュール管理</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  "hover:bg-primary-100 dark:hover:bg-gray-700 hover:translate-x-1",
                  isActive && "bg-gradient-to-r from-primary-100 to-primary-200 dark:from-gray-700 dark:to-gray-600 shadow-inner-glow"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isActive 
                      ? "bg-gradient-to-r from-primary-400 to-primary-500 text-white" 
                      : "bg-primary-50 text-primary-600"
                  )}
                >
                  <Icon />
                </div>
                <span className={cn(
                  "font-medium",
                  isActive ? "text-primary-700 dark:text-primary-300" : "text-gray-700 dark:text-gray-300"
                )}>
                  {item.name}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-primary-500 rounded-full" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* PWA and Status Section */}
        <div className="p-4 space-y-3">
          <PWAStatusIndicator />
          <PWAInstallButton className="w-full" />
          <OfflineIndicator />
        </div>

        {/* User Profile Section */}
        <div className="p-4 border-t border-primary-100 dark:border-gray-700">
          {user && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-gray-700 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white">
                  <UserIcon />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {profile?.nickname || user.email?.split('@')[0] || 'ユーザー'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogoutIcon />
                <span className="font-medium">ログアウト</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar - Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={toggleMobileMenu}
          />

          {/* Mobile sidebar content */}
          <aside
            className={cn(
              "fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-800 shadow-xl z-40 md:hidden",
              "border-r border-primary-100 dark:border-gray-700 animate-slide-in transition-colors duration-300"
            )}
          >
              {/* Logo/Header */}
              <div className="p-6 border-b border-primary-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                      スケマネ
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">魔法のスケジュール管理</p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        "hover:bg-primary-100 dark:hover:bg-gray-700 hover:translate-x-1",
                        isActive && "bg-gradient-to-r from-primary-100 to-primary-200 dark:from-gray-700 dark:to-gray-600 shadow-inner-glow"
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg transition-colors",
                          isActive 
                            ? "bg-gradient-to-r from-primary-400 to-primary-500 text-white" 
                            : "bg-primary-50 text-primary-600"
                        )}
                      >
                        <Icon />
                      </div>
                      <span className={cn(
                        "font-medium",
                        isActive ? "text-primary-700 dark:text-primary-300" : "text-gray-700 dark:text-gray-300"
                      )}>
                        {item.name}
                      </span>
                      
                      {/* Active indicator */}
                      {isActive && (
                        <div className="ml-auto w-2 h-2 bg-primary-500 rounded-full" />
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* PWA and Status Section */}
              <div className="p-4 space-y-3">
                <PWAStatusIndicator />
                <PWAInstallButton className="w-full" />
                <OfflineIndicator />
              </div>

              {/* User Profile Section */}
              <div className="p-4 border-t border-primary-100 dark:border-gray-700">
                {user && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center text-white">
                        <UserIcon />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-700">
                          {profile?.nickname || user.email?.split('@')[0] || 'ユーザー'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <LogoutIcon />
                      <span className="font-medium">ログアウト</span>
                    </button>
                  </div>
                )}
              </div>
            </aside>
        </>
      )}

      {/* Main content */}
      <motion.main 
        className="flex-1 overflow-y-auto"
        layout
        transition={{ duration: 0.3 }}
      >
        <motion.div 
          className={`${spacing.container} py-6 md:py-8`}
          {...animations.fadeIn}
        >
          {children}
        </motion.div>
      </motion.main>
    </div>
  )
}