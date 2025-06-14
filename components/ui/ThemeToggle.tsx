'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme/theme-provider'
import { Button } from './Button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('light')
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="relative h-9 w-9 rounded-md border-0 bg-gradient-to-r from-pastel-purple/20 to-pastel-blue/20 
                 hover:from-pastel-purple/30 hover:to-pastel-blue/30 
                 dark:from-gray-800 dark:to-gray-700 dark:hover:from-gray-700 dark:hover:to-gray-600
                 transition-all duration-300 shadow-soft dark:shadow-gray-800/50"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-blue-400" />
      <span className="sr-only">テーマ切り替え</span>
    </Button>
  )
}