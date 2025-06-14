'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { spacing } from '@/lib/design-system/styles'
import { animations } from '@/lib/design-system/animations'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'narrow' | 'wide'
  animate?: boolean
}

export function ResponsiveContainer({ 
  children, 
  className, 
  variant = 'default',
  animate = true 
}: ResponsiveContainerProps) {
  const variants = {
    default: 'max-w-4xl',
    narrow: 'max-w-2xl', 
    wide: 'max-w-6xl'
  }

  const Component = animate ? motion.div : 'div'
  const animationProps = animate ? animations.pageTransition : {}

  return (
    <Component
      className={cn(
        spacing.container,
        variants[variant],
        'mx-auto px-4 sm:px-6 lg:px-8',
        className
      )}
      {...animationProps}
    >
      {children}
    </Component>
  )
}

// Grid component for responsive layouts
interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: number
  className?: string
}

export function ResponsiveGrid({ 
  children, 
  cols = { sm: 1, md: 2, lg: 3 },
  gap = 6,
  className 
}: ResponsiveGridProps) {
  const gridCols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2', 
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }

  const gapClass = `gap-${gap}`

  return (
    <motion.div
      className={cn(
        'grid',
        cols.sm && `${gridCols[cols.sm]}`,
        cols.md && `md:${gridCols[cols.md]}`,
        cols.lg && `lg:${gridCols[cols.lg]}`,
        cols.xl && `xl:${gridCols[cols.xl]}`,
        gapClass,
        className
      )}
      {...animations.stagger}
    >
      {children}
    </motion.div>
  )
}