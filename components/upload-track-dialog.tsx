'use client'

import { UploadCloud } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { trackWebhook } from '@/hooks/api/Tracks.webhook'
import { userWebhook } from '@/hooks/api/User.webhook'
import { formatTime, normalizeTrackKey, trackKeyOptions } from '@/lib/data'

export function UploadTrackDialog({
  projectId,
  projectName,
  onUploadSuccess,
  onUpload,
  predefinedMetadatas,
  triggerLabel = 'Enviar faixa',
  dialogTitle = 'Enviar faixa',
  dialogDescription = 'Formatos suportados: .mp3 e .wav.',
  successMessage = 'Faixa enviada',
}: {
  projectId?: string
  projectName: string
  predefinedMetadatas?: {
    key?: string | null
    bpm?: number | null
  } | null
  onUploadSuccess?: () => void
  onUpload?: (data: {
    name: string
    bpm: number
    key: string
    duration: number
    file: File
  }) => Promise<void | boolean>
  triggerLabel?: string
  dialogTitle?: string
  dialogDescription?: string
  successMessage?: string
}) {
  const hasPredefinedMetadatas = Boolean(
    predefinedMetadatas?.key && predefinedMetadatas.bpm !== null && predefinedMetadatas.bpm !== undefined,
  )
  const [open, setOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [trackName, setTrackName] = useState('')
  const [bpm, setBpm] = useState(predefinedMetadatas?.bpm?.toString() ?? '')
  const [key, setKey] = useState(predefinedMetadatas?.key ?? '')
  const [duration, setDuration] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    setBpm(predefinedMetadatas?.bpm?.toString() ?? '')
    setKey(predefinedMetadatas?.key ?? '')
  }, [predefinedMetadatas?.bpm, predefinedMetadatas?.key])

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setBpm(predefinedMetadatas?.bpm?.toString() ?? '')
      setKey(predefinedMetadatas?.key ?? '')
    }
    setOpen(nextOpen)
  }

  function extractDuration(file: File) {
    const url = URL.createObjectURL(file)
    const audio = new Audio()

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0)
      URL.revokeObjectURL(url)
    }

    audio.onerror = () => {
      toast.error('Não foi possível ler a duração do arquivo')
      URL.revokeObjectURL(url)
    }

    audio.src = url
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const isBatchUpload = selectedFiles.length > 1
    const hasPredefinedBpm = predefinedMetadatas?.bpm !== null && predefinedMetadatas?.bpm !== undefined
    const hasPredefinedKey = Boolean(predefinedMetadatas?.key)

    if (selectedFiles.length === 0) {
      toast.error('Selecione um arquivo para enviar.')
      return
    }

    if (!isBatchUpload && !trackName.trim()) {
      toast.error('Nome da faixa é obrigatório')
      return
    }

    if (!hasPredefinedBpm && (!bpm.trim() || !Number.isFinite(Number(bpm)) || Number(bpm) <= 0)) {
      toast.error('BPM deve ser um número válido')
      return
    }

    if (!hasPredefinedKey && !key.trim()) {
      toast.error('Tom (Key) é obrigatório')
      return
    }

    if (!onUpload && !projectId) return

    try {
      setUploading(true)

      if (projectId) {
        const response = await userWebhook.me()
        const storageUsed = Number(response.user.storageUsed ?? 0)
        const storageLimit = String(response.user.subscriptionPlan ?? '').toUpperCase().includes('PRO')
          ? 10_000_000_000
          : 500_000_000
        const selectedSize = selectedFiles.reduce((total, file) => total + file.size, 0)

        if (storageUsed + selectedSize > storageLimit) {
          toast.error('Limite de armazenamento excedido', {
            description: 'Remova alguns arquivos ou atualize seu plano para continuar.',
          })
          return
        }
      }

      if (onUpload) {
        const selectedFile = selectedFiles[0]
        const uploadResult = await onUpload({
          name: trackName.trim(),
          bpm: Number(bpm),
          key: normalizeTrackKey(key),
          duration: Math.round(duration),
          file: selectedFile,
        })
        if (uploadResult === false) return
      } else {
        await trackWebhook.create({
          projectId: projectId!,
          name: trackName,
          ...(bpm.trim() ? { bpm: Number(bpm) } : {}),
          ...(key.trim() ? { key: normalizeTrackKey(key) } : {}),
          duration: Math.round(duration),
          versionName: trackName.trim(),
          files: selectedFiles,
        })
      }

      toast.success(successMessage, {
        description: `${successMessage} com sucesso.`,
      })

      setSelectedFiles([])
      setTrackName('')
      setBpm('')
      setKey('')
      setDuration(0)
      setOpen(false)
      onUploadSuccess?.()
    } catch (error) {
      toast.error('Não foi possível enviar a faixa', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <UploadCloud className="size-4" />
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-w-md max-sm:max-h-[90vh] max-sm:overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center transition-colors hover:border-foreground/30"
          >
            <UploadCloud className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} arquivo${selectedFiles.length > 1 ? 's' : ''} selecionado${selectedFiles.length > 1 ? 's' : ''}`
                : 'Clique para selecionar um arquivo'}
            </span>
            <span className="font-mono text-xs text-muted-foreground">MP3 ou WAV</span>
            {duration > 0 && (
              <span className="font-mono text-xs text-muted-foreground">
                Duração: {formatTime(duration)}
              </span>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.wav,audio/*"
            multiple={Boolean(projectId)}
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              if (files.length > 20) {
                toast.error('Você pode selecionar no máximo 20 arquivos.')
                e.target.value = ''
                return
              }

              setSelectedFiles(files)
              const file = files[0] ?? null
              if (file) {
                setTrackName(file.name.replace(/\.[^/.]+$/, ''))
                extractDuration(file)
              }
              e.target.value = ''
            }}
          />

          {selectedFiles.length > 0 && (
            <>
              {selectedFiles.length === 1 && <div className="space-y-2">
                <Label htmlFor="track-name">Nome da faixa</Label>
                <Input
                  id="track-name"
                  value={trackName}
                  onChange={(e) => setTrackName(e.target.value)}
                  placeholder="Ex: My Song"
                />
              </div>}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bpm">BPM</Label>
                  <Input
                    id="bpm"
                    type="number"
                    value={bpm}
                    onChange={(e) => setBpm(e.target.value)}
                    placeholder="120"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key">Tom (Key)</Label>
                  <select
                    id="key"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent dark:bg-input/30 px-2.5 py-1 text-sm text-foreground transition-colors outline-none appearance-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-transparent disabled:opacity-50"
                  >
                    {!predefinedMetadatas?.key && <option value="">Selecione o tom</option>}
                    {trackKeyOptions.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="bg-input text-foreground"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <DialogFooter>
            {selectedFiles.length > 1 && uploading && (
              <p className="w-full text-center text-xs text-muted-foreground sm:text-left">
                Enviando suas faixas, isso pode demorar alguns minutos.
              </p>
            )}
            <Button type="submit" className="w-full sm:w-auto" disabled={uploading || selectedFiles.length === 0}>
              {uploading ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

