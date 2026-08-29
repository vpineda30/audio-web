'use client'

import { useTheme } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

type MonogramProps = {
  className?: string
  inverted?: boolean
  onClick?: () => void
}

export function Monogram({
  className = '',
  inverted = false,
  onClick
}: MonogramProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const logo = inverted
    ? isDark
      ? '/black-logo.png'
      : '/light-logo.png'
    : isDark
      ? '/light-logo.png'
      : '/black-logo.png'

  return (
    <div className={cn('flex h-10 w-14 shrink-0 items-center justify-center', className)}>
      <img
        src={logo}
        alt=".Audio"
        width={56}
        height={32}
        className="h-auto w-full object-contain cursor-pointer transition-opacity hover:opacity-80"
        onClick={onClick}
      />
    </div>
  )
}