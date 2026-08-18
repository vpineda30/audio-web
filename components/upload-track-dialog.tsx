'use client'

import { UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
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
import { formatTime, normalizeTrackKey, trackKeyOptions } from '@/lib/data'

export function UploadTrackDialog({
  projectId,
  projectName,
  onUploadSuccess,
}: {
  projectId: string
  projectName: string
  onUploadSuccess?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [trackName, setTrackName] = useState('')
  const [bpm, setBpm] = useState('')
  const [key, setKey] = useState(trackKeyOptions[0].value)
  const [duration, setDuration] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  function extractDuration(file: File) {
    const url = URL.createObjectURL(file)
    const audio = new Audio()

    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0)
      URL.revokeObjectURL(url)
    }

    audio.onerror = () => {
      toast.error('NÃ£o foi possÃ­vel ler a duraÃ§Ã£o do arquivo')
      URL.revokeObjectURL(url)
    }

    audio.src = url
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedFile) {
      toast.error('Selecione um arquivo para enviar.')
      return
    }

    if (!trackName.trim()) {
      toast.error('Nome da faixa Ã© obrigatÃ³rio')
      return
    }

    if (!bpm || isNaN(Number(bpm))) {
      toast.error('BPM deve ser um nÃºmero vÃ¡lido')
      return
    }

    if (!key.trim()) {
      toast.error('Tom (Key) Ã© obrigatÃ³rio')
      return
    }

    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')

    if (!userId || !token) {
      toast.error('UsuÃ¡rio nÃ£o autenticado')
      return
    }

    try {
      setUploading(true)

      await trackWebhook.create(token, {
        userId,
        projectId,
        name: trackName,
        bpm: Number(bpm),
        key: normalizeTrackKey(key),
        duration: Math.round(duration),
        versionName: 'v1',
        file: selectedFile,
      })

      toast.success('Faixa enviada', {
        description: "A faixa foi adicionada ao projeto.",
      })

      setSelectedFile(null)
      setFileName(null)
      setTrackName('')
      setBpm('')
      setKey(trackKeyOptions[0].value)
      setDuration(0)
      setOpen(false)
      onUploadSuccess?.()
    } catch (error) {
      toast.error('NÃ£o foi possÃ­vel enviar a faixa', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <UploadCloud className="size-4" />
        Enviar faixa
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar faixa</DialogTitle>
          <DialogDescription>Formatos suportados: .mp3 e .wav.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center transition-colors hover:border-foreground/30"
          >
            <UploadCloud className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium">
              {fileName ?? 'Clique para selecionar um arquivo'}
            </span>
            <span className="font-mono text-xs text-muted-foreground">MP3 ou WAV</span>
            {duration > 0 && (
              <span className="font-mono text-xs text-muted-foreground">
                DuraÃ§Ã£o: {formatTime(duration)}
              </span>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.wav,audio/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              setSelectedFile(file)
              setFileName(file?.name ?? null)
              if (file) {
                setTrackName(file.name.replace(/\.[^/.]+$/, ''))
                extractDuration(file)
              }
            }}
          />

          {selectedFile && (
            <>
              <div className="space-y-2">
                <Label htmlFor="track-name">Nome da faixa</Label>
                <Input
                  id="track-name"
                  value={trackName}
                  onChange={(e) => setTrackName(e.target.value)}
                  placeholder="Ex: My Song"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
            <Button type="submit" className="w-full sm:w-auto" disabled={uploading || !selectedFile}>
              {uploading ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

