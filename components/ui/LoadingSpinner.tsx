'use client'

import { motion } from 'framer-motion'
import { animations } from '@/lib/design-system/animations'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  message?: string
}

export function LoadingSpinner({ size = 'md', className, message }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  }

  return (
    <motion.div 
      className={cn("flex flex-col items-center justify-center", className)}
      {...animations.fadeIn}
    >
      <motion.div
        className={cn(
          "border-4 border-primary-200 border-t-primary-500 rounded-full",
          sizes[size]
        )}
        {...animations.loading}
      />
      {message && (
        <motion.p 
          className="mt-4 text-gray-600 text-sm"
          {...animations.slideIn}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  )
}