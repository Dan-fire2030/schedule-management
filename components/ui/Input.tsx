'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { inputStyles } from '@/lib/design-system/styles'
import { animations } from '@/lib/design-system/animations'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  variant?: 'default' | 'error' | 'success'
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, variant = 'default', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    
    const currentVariant = error ? 'error' : variant

    return (
      <div className="relative">
        {label && (
          <label
            className={cn(
              "absolute left-4 transition-all duration-300 pointer-events-none z-10",
              isFocused || props.value
                ? "text-xs -top-2 bg-white px-1 text-primary-600 scale-85"
                : "text-base top-3 text-gray-500 scale-100"
            )}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={cn(
              inputStyles.base,
              inputStyles.variants[currentVariant],
              icon && "pl-10",
              className
            )}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...props}
          />
        </div>
        
        {error && (
          <motion.p 
            className="mt-1 text-sm text-red-500"
            {...animations.fadeIn}
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'