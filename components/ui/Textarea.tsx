'use client'

import React, { useState } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  variant?: 'default' | 'mystic' | 'sand'
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, variant = 'default', ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false)
    
    const baseStyles = 'w-full px-4 py-3 rounded-xl border bg-white transition-all duration-300 outline-none resize-none'
    
    const variants = {
      default: 'border-primary-200 focus:border-primary-400 focus:shadow-md',
      mystic: 'border-secondary-200 focus:border-secondary-400 focus:shadow-md',
      sand: 'border-sand-300 focus:border-sand-500 focus:shadow-md'
    }

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
        
        <textarea
          ref={ref}
          className={cn(
            baseStyles,
            variants[variant],
            error && "border-red-400",
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {/* Error message */}
        {error && (
          <p className="mt-1 text-sm text-red-500 animate-fade-in">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'