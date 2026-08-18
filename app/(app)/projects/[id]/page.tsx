'use client'

import { ArrowLeft, Clock, HardDrive, Music, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrackPlayer } from '@/components/track-player'
import { UploadTrackDialog } from '@/components/upload-track-dialog'
import { projectWebhook } from '@/hooks/api/Projects.webhook'
import { trackWebhook } from '@/hooks/api/Tracks.webhook'
import { formatDate, formatTime, formatTrackKey, normalizeTrackKey, trackKeyOptions, type Project, type Track } from '@/lib/data'
import { ColorPickerPopover } from '@/components/change-project-color'
import { motion } from 'framer-motion'

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [trackEditOpen, setTrackEditOpen] = useState(false)
  const [trackEditSaving, setTrackEditSaving] = useState(false)
  const [trackToEdit, setTrackToEdit] = useState<Track | null>(null)
  const [trackEditName, setTrackEditName] = useState('')
  const [trackEditBpm, setTrackEditBpm] = useState('')
  const [trackEditKey, setTrackEditKey] = useState('C')
  const [trackEditVersionName, setTrackEditVersionName] = useState('')
  const [trackDeleteOpen, setTrackDeleteOpen] = useState(false)
  const [trackDeleting, setTrackDeleting] = useState(false)

  async function fetchProjectTracks(token: string, userId: string, projectId: string) {
    const trackList = await trackWebhook.findByProject(token, userId, projectId)

    return Promise.all(
      trackList.map(async (track) => {
        let src = ''

        try {
          const fileUrl = await trackWebhook.getFileUrl(token, {
            userId,
            trackId: track.id,
            expiresIn: 3600,
          })
          src = fileUrl.url
        } catch {
          src = ''
        }

        const fileSize = Number(track.fileSize ?? 0)

        return {
          id: track.id,
          name: track.name,
          format: (track.mimeType?.includes('wav') ? 'wav' : 'mp3') as Track['format'],
          duration: Number(track.duration ?? 0),
          sizeMB: Number.isFinite(fileSize) ? fileSize / (1024 * 1024) : 0,
          bpm: track.bpm ?? 0,
          key: formatTrackKey(track.key),
          addedAt: track.createdAt ?? new Date().toISOString(),
          src,
        } satisfies Track
      }),
    )
  }

  useEffect(() => {
    async function loadProject() {
      const userId = localStorage.getItem('userId')
      const token = localStorage.getItem('token')

      if (!userId || !token) {
        toast.error('Usuário não autenticado')
        setLoading(false)
        return
      }

      try {
        let selected: Project | undefined = await projectWebhook.findById(token, userId, params.id)

        if (!selected) {
          const all = await projectWebhook.findAll(token, userId)

          selected = all.find((p) => p.name === params.id)

          if (!selected) {
            const idx = Number(params.id)

            if (!Number.isNaN(idx) && all[idx]) {
              selected = all[idx]
            } else {
              const parts = params.id.split('-')
              const maybeIndex = Number(parts[parts.length - 1])

              if (!Number.isNaN(maybeIndex) && all[maybeIndex - 1]) {
                selected = all[maybeIndex - 1]
              }
            }
          }
        }

        if (!selected) {
          setProject(null)
          return
        }

        const mappedProject: Project = {
          id: selected.id,
          name: selected.name,
          description: selected.description ?? 'Sem Descrição',
          color: selected.color ?? '#EF4444',
          createAt: selected.createAt,
          updateAt: selected.updateAt,
          size: selected.size,
          tracks: [],
        }

        const projectTracks = await fetchProjectTracks(token, userId, mappedProject.id)

        mappedProject.tracks = projectTracks

        setProject(mappedProject)
        setTracks(projectTracks)
        setName(mappedProject.name)
        setDescription(mappedProject.description)
      } catch (error) {
        toast.error('Não foi possível carregar o projeto', {
          description: error instanceof Error ? error.message : 'Tente novamente.',
        })
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [params.id])

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()

    if (!project) return

    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')

    if (!userId || !token) return

    try {
      setSaving(true)

      await projectWebhook.update(token, {
        userid: userId,
        projectId: project.id,
        project: {
          name: name.trim(),
          description: description.trim() || undefined,
        },
      })

      setProject((current) =>
        current
          ? {
            ...current,
            name: name.trim(),
            description: description.trim(),
          }
          : current,
      )

      setEditOpen(false)
      toast.success('Projeto atualizado')
    } catch (error) {
      toast.error('Não foi possível atualizar o projeto', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateProjectColor(projectId: string, color: string) {
    if (!project) return

    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')

    if (!userId || !token) return

    const previousColor = project.color
    setProject((prev) => (prev ? { ...prev, color } : prev))

    try {
      await projectWebhook.update(token, {
        userid: userId,
        projectId: projectId,
        project: {
          color: color,
        },
      })
      toast.success('Cor do projeto atualizada!')
    } catch (error) {
      setProject((prev) => (prev ? { ...prev, color: previousColor } : prev))
      toast.error('Não foi possível atualizar a cor do projeto', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  async function refreshTracks() {
    if (!project) return

    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')

    if (!userId || !token) return

    const projectTracks = await fetchProjectTracks(token, userId, project.id)
    setTracks(projectTracks)
    setProject((prev) => (prev ? { ...prev, tracks: projectTracks } : prev))
  }

  function openTrackEditDialog(track: Track) {
    setTrackToEdit(track)
    setTrackEditName(track.name)
    setTrackEditBpm(String(track.bpm))
    setTrackEditKey(normalizeTrackKey(track.key || trackKeyOptions[0].value))
    setTrackEditVersionName(track.versionName ?? 'v1')
    setTrackEditOpen(true)
  }

  function openTrackDeleteDialog(track: Track) {
    setTrackToEdit(track)
    setTrackDeleteOpen(true)
  }

  async function handleUpdateTrack(e: React.FormEvent) {
    e.preventDefault()

    if (!trackToEdit) return

    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')

    if (!userId || !token) {
      toast.error('Usuário não autenticado')
      return
    }

    try {
      setTrackEditSaving(true)

      await trackWebhook.update(token, {
        userId,
        trackId: trackToEdit.id,
        track: {
          name: trackEditName.trim(),
          bpm: Number(trackEditBpm) || undefined,
          key: normalizeTrackKey(trackEditKey.trim()) || undefined,
          versionName: trackEditVersionName.trim() || undefined,
        },
      })

      const updatedTracks = tracks.map((track) =>
        track.id === trackToEdit.id
          ? {
            ...track,
            name: trackEditName.trim(),
            bpm: Number(trackEditBpm) || track.bpm,
            key: normalizeTrackKey(trackEditKey.trim()) || track.key,
            versionName: trackEditVersionName.trim() || track.versionName,
          }
          : track,
      )

      setTracks(updatedTracks)
      setProject((prev) =>
        prev
          ? {
            ...prev,
            tracks: updatedTracks,
          }
          : prev,
      )

      toast.success('Faixa atualizada')
      setTrackEditOpen(false)
    } catch (error) {
      toast.error('Não foi possível atualizar a faixa', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setTrackEditSaving(false)
    }
  }

  async function handleDeleteTrack() {
    if (!trackToEdit) return

    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')

    if (!userId || !token) {
      toast.error('Usuário não autenticado')
      return
    }

    try {
      setTrackDeleting(true)

      await trackWebhook.delete(token, userId, trackToEdit.id)

      const remainingTracks = tracks.filter((track) => track.id !== trackToEdit.id)
      setTracks(remainingTracks)
      setProject((prev) =>
        prev
          ? {
            ...prev,
            tracks: remainingTracks,
          }
          : prev,
      )

      toast.success('Faixa removida')
      setTrackDeleteOpen(false)
      setTrackToEdit(null)
    } catch (error) {
      toast.error('Não foi possível remover a faixa', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setTrackDeleting(false)
    }
  }

  async function handleDelete() {
    if (!project) return

    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')

    if (!userId || !token) return

    try {
      setDeleting(true)

      await projectWebhook.delete(token, userId, project.id)

      toast.success('Projeto removido')
      router.push('/projects')
    } catch (error) {
      toast.error('Não foi possível remover o projeto', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando projeto...</p>
  }

  if (!project) {
    return <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>
  }

  const totalSeconds = project.tracks.reduce((s, t) => s + t.duration, 0)
  const totalSizeMB = project.tracks.reduce((s, t) => s + t.sizeMB, 0)

  const stats = [
    { label: 'Faixas', value: `${project.tracks.length}`, icon: Music },
    { label: 'Duração', value: formatTime(totalSeconds), icon: Clock },
    { label: 'Tamanho', value: `${totalSizeMB.toFixed(1)} MB`, icon: HardDrive },
  ]

  return (
    <motion.div className="flex flex-col gap-8 pb-28"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <Button
          nativeButton={false}
          render={<Link href="/projects" />}
          variant="ghost"
          size="sm"
          className="-ml-2 mb-4 text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Projetos
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <ColorPickerPopover
              selectedColor={project.color}
              onSelectColor={(newColor) => {
                handleUpdateProjectColor(project.id, newColor)
              }}
            />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-balance">{project.name}</h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">{project.description}</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Atualizado em {formatDate(project.updateAt)}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                <Pencil className="size-4" />
                Editar
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar projeto</DialogTitle>
                  <DialogDescription>Atualize o nome e a descrição deste projeto.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEdit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="edit-name">Nome</Label>
                    <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="edit-description">Descrição</Label>
                    <Input id="edit-description" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                      {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger render={<Button variant="destructive" size="sm" />}>
                <Trash2 className="size-4" />
                Deletar
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Excluir projeto</DialogTitle>
                  <DialogDescription>
                    Esta ação remove o projeto da sua conta. Ela não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <UploadTrackDialog
              projectId={project.id}
              projectName={project.name}
              onUploadSuccess={refreshTracks}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          {stats.map((s) => (
            <Card key={s.label} className="gap-0 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <s.icon className="size-4 text-muted-foreground" />
              </div>
              <span className="mt-4 text-2xl font-semibold tracking-tight">{s.value}</span>
            </Card>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="mb-4 text-sm font-medium">Faixas</h2>
          <TrackPlayer tracks={tracks} onEditTrack={openTrackEditDialog} onDeleteTrack={openTrackDeleteDialog} />
        </div>

        <Dialog open={trackEditOpen} onOpenChange={setTrackEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar faixa</DialogTitle>
              <DialogDescription>Atualize o título, BPM, tom ou versão desta faixa.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateTrack} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="track-edit-name">Nome da faixa</Label>
                <Input
                  id="track-edit-name"
                  value={trackEditName}
                  onChange={(e) => setTrackEditName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="track-edit-bpm">BPM</Label>
                  <Input
                    id="track-edit-bpm"
                    type="number"
                    value={trackEditBpm}
                    onChange={(e) => setTrackEditBpm(e.target.value)}
                    placeholder="120"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="track-edit-key">Tom (Key)</Label>
                  <select
                    id="track-edit-key"
                    value={trackEditKey}
                    onChange={(e) => setTrackEditKey(e.target.value)}
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
              <div className="space-y-2">
                <Label htmlFor="track-edit-version">Versão</Label>
                <Input
                  id="track-edit-version"
                  value={trackEditVersionName}
                  onChange={(e) => setTrackEditVersionName(e.target.value)}
                  placeholder="v1"
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full sm:w-auto" disabled={trackEditSaving}>
                  {trackEditSaving ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={trackDeleteOpen} onOpenChange={setTrackDeleteOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Remover faixa</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover a faixa{' '}
                <strong>{trackToEdit?.name ?? 'selecionada'}</strong>?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTrackDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteTrack} disabled={trackDeleting}>
                {trackDeleting ? 'Removendo...' : 'Remover faixa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  )
}