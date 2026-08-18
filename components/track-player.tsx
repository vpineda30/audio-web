'use client'

import { MoreHorizontal, Music, Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { formatTime, formatFileSize, type Track } from '@/lib/data'

export function TrackPlayer({ tracks, onEditTrack, onDeleteTrack }: { tracks: Track[]; onEditTrack?: (track: Track) => void; onDeleteTrack?: (track: Track) => void }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(50)

  const current = currentIndex !== null ? tracks[currentIndex] : null

  async function playAudio(audio: HTMLAudioElement) {
    try {
      await audio.play()
      setPlaying(true)
    } catch {
      setPlaying(false)
      toast.error('Não foi possível reproduzir', {
        description: 'A prévia de áudio pode estar indisponível.',
      })
    }
  }

  async function selectTrack(index: number) {
    const audio = audioRef.current
    const track = tracks[index]

    if (!audio || !track?.src) {
      toast.error('Áudio indisponível para esta faixa.')
      return
    }

    if (index === currentIndex) {
      togglePlay()
      return
    }

    setCurrentIndex(index)
    audio.src = track.src
    audio.currentTime = 0
    await playAudio(audio)
  }

  function handleVolumeChange(value: number | readonly number[]) {
    const nextValue = Array.isArray(value) ? value[0] : value
    const audio = audioRef.current

    setVolume(nextValue)
    if (audio) {
      audio.volume = nextValue / 100
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = volume / 100
    }
  }, [volume])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio || currentIndex === null) return

    const track = tracks[currentIndex]
    if (!track?.src) {
      toast.error('Áudio indisponível para esta faixa.')
      return
    }

    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      if (audio.src !== track.src) {
        audio.src = track.src
        audio.currentTime = 0
      }
      playAudio(audio)
    }
  }

  async function skip(dir: 1 | -1) {
    if (currentIndex === null || tracks.length === 0) return
    const next = (currentIndex + dir + tracks.length) % tracks.length
    const audio = audioRef.current
    const track = tracks[next]

    if (!audio || !track?.src) {
      toast.error('Áudio indisponível para esta faixa.')
      return
    }

    setCurrentIndex(next)
    audio.src = track.src
    audio.currentTime = 0
    await playAudio(audio)
  }

  function onSeek(value: number | readonly number[]) {
    const audio = audioRef.current
    if (!audio || !duration) return
    const v = Array.isArray(value) ? value[0] : value
    const time = (v / 100) * duration
    audio.currentTime = time
    setProgress(Number(v))
  }

  return (
    <>
      {/* Lista de faixas */}
      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {tracks.map((t, i) => {
          const isCurrent = i === currentIndex
          return (
            <li
              key={t.id}
              className={cn(
                'flex items-center gap-4 px-4 py-3 transition-colors sm:px-5',
                isCurrent && 'bg-muted/50',
              )}
            >
              <Button
                variant={isCurrent && playing ? 'default' : 'secondary'}
                size="icon"
                className="size-9 shrink-0 rounded-full"
                onClick={() => selectTrack(i)}
                aria-label={isCurrent && playing ? 'Pausar' : 'Reproduzir'}
              >
                {isCurrent && playing ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
              </Button>

              <div className="min-w-0 flex-1">
                <p className={cn('truncate text-sm', isCurrent ? 'font-medium' : 'font-normal')}>
                  {t.name}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {t.bpm} BPM · {t.key} · {formatFileSize(t.sizeMB)}
                </p>
              </div>

              <Badge variant="secondary" className="hidden font-mono text-[10px] uppercase sm:inline-flex">
                {t.format}
              </Badge>
              <span className="w-12 text-right font-mono text-xs text-muted-foreground">
                {formatTime(t.duration)}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon" className="size-8 shrink-0" />}
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toast('Download iniciado', { description: t.name })}>
                    Baixar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditTrack?.(t)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDeleteTrack?.(t)}
                  >
                    Remover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          )
        })}
      </ul>

      <audio
        ref={audioRef}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onTimeUpdate={(e) => {
          const a = e.currentTarget
          setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0)
        }}
        onEnded={() => skip(1)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => {
          setPlaying(false)
          toast.error('Não foi possível reproduzir', {
            description: 'A prévia de áudio pode estar indisponível ou inválida.',
          })
        }}
        preload="none"
      />

      {/* Barra do player */}
      {current && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-md md:left-64">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted">
              <Music className="size-4 text-muted-foreground" />
            </span>
            <div className="hidden min-w-0 w-44 sm:block">
              <p className="truncate text-sm font-medium">{current.name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{current.format.toUpperCase()}</p>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => skip(-1)} aria-label="Anterior">
                <SkipBack className="size-4" />
              </Button>
              <Button size="icon" className="rounded-full" onClick={togglePlay} aria-label="Play/Pause">
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => skip(1)} aria-label="Próxima">
                <SkipForward className="size-4" />
              </Button>
            </div>

            <div className="flex flex-1 items-center gap-3">
              <span className="w-10 text-right font-mono text-xs text-muted-foreground">
                {formatTime((progress / 100) * duration || 0)}
              </span>
              <Slider value={[progress]} onValueChange={onSeek} max={100} step={0.1} className="flex-1" />
              <span className="w-10 font-mono text-xs text-muted-foreground">
                {formatTime(duration || current.duration)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Volume"
                onClick={() => handleVolumeChange(volume > 0 ? 0 : 50)}
              >
                <Volume2 className="size-4" />
              </Button>
              <div className="w-32">
                <Slider value={[volume]} onValueChange={handleVolumeChange} max={100} step={1} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
