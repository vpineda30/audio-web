'use client'

import { cn } from '@/lib/utils'
import { useMemo } from 'react'

type WaveformProps = {
  bars?: number
  className?: string
  playing?: boolean
}

export function Waveform({ bars = 48, className, playing = true }: WaveformProps) {
  const seeds = useMemo(
    () =>
      Array.from({ length: bars }).map((_, i) => {
        const base = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1
        return {
          min: (12 + base * 20).toFixed(2),
          max: (45 + base * 55).toFixed(2),
          duration: (0.8 + (Math.abs(Math.cos(i * 4.123)) % 1) * 1.1).toFixed(3),
          delay: ((Math.abs(Math.sin(i * 7.77)) % 1) * 1.2).toFixed(3),
        }
      }),
    [bars],
  )

  return (
    <div
      aria-hidden="true"
      className={cn('flex h-full w-full items-center justify-between gap-[3px]', className)}
    >
      {seeds.map((s, i) => (
        <span
          key={i}
          className="flex-1 rounded-full bg-current"
          style={
            {
              height: playing ? `${s.min}%` : '10%',
              animation: playing
                ? `wave-pulse ${s.duration}s ease-in-out ${s.delay}s infinite alternate`
                : undefined,
              '--wave-max': `${s.max}%`,
              '--wave-min': `${s.min}%`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
