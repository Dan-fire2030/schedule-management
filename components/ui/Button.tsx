'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { buttonStyles } from '@/lib/design-system/styles'
import { animations } from '@/lib/design-system/animations'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'magic' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  isLoading?: boolean
  icon?: React.ReactNode
  children?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    isLoading = false,
    icon,
    children,
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonStyles.base,
          buttonStyles.variants[variant],
          buttonStyles.sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        
        {isLoading && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center bg-inherit"
            {...animations.fadeIn}
          >
            <motion.svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              {...animations.loading}
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </motion.svg>
          </motion.div>
        )}
        
        <span
          className={cn(
            "flex items-center gap-2",
            isLoading && "opacity-0"
          )}
        >
          {icon && <span>{icon}</span>}
          {children}
        </span>

      </button>
    )
  }
)

Button.displayName = 'Button'