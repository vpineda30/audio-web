'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

type MonogramProps = {
  className?: string
  inverted?: boolean
}

export function Monogram({
  className = '',
  inverted = false,
}: MonogramProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = resolvedTheme === 'dark'

  const logo = inverted
    ? isDark
      ? '/black-logo.png'
      : '/light-logo.png'
    : isDark
      ? '/light-logo.png'
      : '/black-logo.png'

  return (
    <div className="flex justify-center align-center h-8 bg-blue">
      <img src={logo} className='flex align-center'></img>
    </div>
  )
}