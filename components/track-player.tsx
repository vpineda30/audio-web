'use client'

import { MoreHorizontal, Music, Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { API_URL } from '@/hooks/api/api'
import { trackWebhook } from '@/hooks/api/Tracks.webhook'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { formatTime, formatFileSize, type Track } from '@/lib/data'

type TrackPlayerProps = {
  tracks: Track[]
  remote?: boolean
  persistent?: boolean
  onEditTrack?: (track: Track) => void
  onDeleteTrack?: (track: Track) => void
  onNewVersion?: (track: Track) => void
}

export function TrackPlayer({ tracks, remote = false, persistent = false, onEditTrack, onDeleteTrack, onNewVersion }: TrackPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [playlist, setPlaylist] = useState<Track[]>([])
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(50)
  const [isDraggingProgress, setIsDraggingProgress] = useState(false)

  const availableTracks = persistent ? playlist : tracks
  const current = currentIndex !== null ? availableTracks[currentIndex] : null

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
    const track = availableTracks[index]

    if (remote) {
      window.dispatchEvent(new CustomEvent('audio:select-track', { detail: { tracks, index } }))
      return
    }

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
    audio.load()
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

    const track = availableTracks[currentIndex]
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
        audio.load()
      }
      playAudio(audio)
    }
  }

  async function skip(dir: 1 | -1) {
    if (currentIndex === null || availableTracks.length === 0) return
    const next = (currentIndex + dir + availableTracks.length) % availableTracks.length

    if (persistent) {
      setCurrentIndex(next)
      return
    }

    const audio = audioRef.current
    const track = availableTracks[next]

    if (!audio || !track?.src) {
      toast.error('Áudio indisponível para esta faixa.')
      return
    }

    setCurrentIndex(next)
    audio.src = track.src
    audio.currentTime = 0
    audio.load()
    await playAudio(audio)
  }

  useEffect(() => {
    if (!persistent) return

    function handleTrackSelection(event: Event) {
      const detail = (event as CustomEvent<{ tracks: Track[]; index: number }>).detail
      setPlaylist(detail.tracks)
      setCurrentIndex(detail.index)
    }

    window.addEventListener('audio:select-track', handleTrackSelection)
    return () => window.removeEventListener('audio:select-track', handleTrackSelection)
  }, [persistent])

  useEffect(() => {
    if (!persistent || currentIndex === null || !availableTracks[currentIndex]) return

    const audio = audioRef.current
    const track = availableTracks[currentIndex]
    if (!audio || !track.src) return

    audio.src = track.src
    audio.currentTime = 0
    audio.load()
    playAudio(audio)
  }, [persistent, currentIndex, availableTracks])

  function onSeek(value: number | readonly number[]) {
    const audio = audioRef.current
    if (!audio || !duration) return
    const v = Array.isArray(value) ? value[0] : value
    const time = (v / 100) * duration
    audio.currentTime = time
    setProgress(Number(v))
  }

  function updateProgressFromPointer(clientX: number) {
    const audio = audioRef.current
    if (!audio || !duration || !progressBarRef.current) return

    const rect = progressBarRef.current.getBoundingClientRect()
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    const nextProgress = ratio * 100

    onSeek(nextProgress)
  }

  function handleProgressBarClick(event: React.MouseEvent<HTMLDivElement>) {
    updateProgressFromPointer(event.clientX)
  }

  function handleProgressBarPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!duration) return
    event.preventDefault()
    setIsDraggingProgress(true)
    updateProgressFromPointer(event.clientX)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleProgressBarPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingProgress || !duration) return
    event.preventDefault()
    updateProgressFromPointer(event.clientX)
  }

  function handleProgressBarPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingProgress) return
    setIsDraggingProgress(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  async function downloadTrack(track: Track) {
    try {
      const response = await fetch(`${API_URL}/tracks/download/${encodeURIComponent(track.id)}`, {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error('Falha ao carregar o arquivo para download.')
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `${track.name || 'track'}${track.format ? `.${track.format}` : ''}`
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)

      toast.success('Download iniciado', {
        description: track.name,
      })
    } catch (error) {
      toast.error('Não foi possível baixar a faixa', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  return (
    <>
      {/* Lista de faixas */}
      {!persistent && <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {tracks.map((t, i) => {
          const isCurrent = i === currentIndex
          return (
            <li
              key={t.id}
              className={cn(
                'flex min-w-0 items-center gap-3 px-3 py-3 transition-colors sm:gap-4 sm:px-5',
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
              <span className="hidden w-12 text-right font-mono text-xs text-muted-foreground sm:block">
                {formatTime(t.duration)}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" size="icon" className="size-8 shrink-0" />}
                >
                  <MoreHorizontal className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onNewVersion?.(t)} className="bg-primary text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground">
                    Versões
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadTrack(t)}>
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
      </ul>}

      {!remote && <audio
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
      />}

      {/* Barra do player */}
      {!remote && current && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/90 backdrop-blur-md md:left-64">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6 lg:px-8">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted sm:size-11">
              <Music className="size-4 text-muted-foreground" />
            </span>

            <div className="hidden min-w-0 w-44 sm:block">
              <p className="truncate text-sm font-medium">{current.name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{current.format.toUpperCase()}</p>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              <Button variant="ghost" size="icon" onClick={() => skip(-1)} aria-label="Anterior">
                <SkipBack className="size-4" />
              </Button>
              <Button size="icon" className="rounded-full sm:size-9" onClick={togglePlay} aria-label="Play/Pause">
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => skip(1)} aria-label="Próxima">
                <SkipForward className="size-4" />
              </Button>
            </div>

            <div className="order-3 flex w-full min-w-0 items-center gap-2 sm:order-none sm:w-auto sm:flex-1 sm:gap-3">
              <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted-foreground sm:text-xs">
                {formatTime((progress / 100) * duration || 0)}
              </span>
              <div className="flex min-w-0 flex-1 items-center px-1 py-2 sm:px-2 sm:py-3">
                <div
                  ref={progressBarRef}
                  className="relative h-4 min-w-0 flex-1 cursor-pointer overflow-visible rounded-full sm:h-7"
                  onClick={handleProgressBarClick}
                  onPointerDown={handleProgressBarPointerDown}
                  onPointerMove={handleProgressBarPointerMove}
                  onPointerUp={handleProgressBarPointerUp}
                  onPointerCancel={handleProgressBarPointerUp}
                  aria-label="Progresso da faixa"
                  style={{ touchAction: 'none' }}
                >
                  <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-muted/70 sm:h-2" />
                  <div
                    className="absolute inset-y-1/2 left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-foreground via-foreground to-foreground/80 transition-[width] duration-150 sm:h-2"
                    style={{
                      width: `${Math.min(Math.max(progress, 0), 100)}%`,
                      minWidth: progress > 0 ? '12px' : '0px',
                    }}
                  />
                  <div
                    className="pointer-events-none absolute top-1/2 h-2 w-3 -translate-y-1/2 rounded-full border border-background bg-foreground shadow-[0_0_0_2px_rgba(255,255,255,0.12)] sm:h-3.5 sm:w-3.5"
                    style={{ left: `calc(${Math.min(Math.max(progress, 0), 100)}% - 6px)` }}
                  />
                </div>
              </div>
              <span className="w-10 shrink-0 text-right font-mono text-[10px] text-muted-foreground sm:text-xs">
                {formatTime(duration || current.duration)}
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Volume"
                onClick={() => handleVolumeChange(volume > 0 ? 0 : 50)}
              >
                <Volume2 className="size-4" />
              </Button>
              <div className="w-20 sm:w-28">
                <Slider value={[volume]} onValueChange={handleVolumeChange} max={100} step={1} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
