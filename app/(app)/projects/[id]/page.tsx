'use client'

import { ArrowLeft, Check, ChevronDown, Clock, Filter, HardDrive, Music, Pencil, Trash2, UploadCloud } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
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
import { trackWebhook, type TrackVersionRecord } from '@/hooks/api/Tracks.webhook'
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
  const [shareOpen, setShareOpen] = useState(false)
  const [sharePermission, setSharePermission] = useState<'READ' | 'DOWNLOAD' | 'EDIT'>('READ')
  const [shareExpiresAt, setShareExpiresAt] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [creatingShareLink, setCreatingShareLink] = useState(false)
  const [copyingShareLink, setCopyingShareLink] = useState(false)
  const [trackEditOpen, setTrackEditOpen] = useState(false)
  const [trackEditSaving, setTrackEditSaving] = useState(false)
  const [trackToEdit, setTrackToEdit] = useState<Track | null>(null)
  const [trackEditName, setTrackEditName] = useState('')
  const [trackEditBpm, setTrackEditBpm] = useState('')
  const [trackEditKey, setTrackEditKey] = useState<string>('C')
  const [trackEditActiveVersionId, setTrackEditActiveVersionId] = useState('')
  const [trackDeleteOpen, setTrackDeleteOpen] = useState(false)
  const [trackDeleting, setTrackDeleting] = useState(false)
  const [trackFilterOpen, setTrackFilterOpen] = useState(false)
  const [trackFilterName, setTrackFilterName] = useState('')
  const [trackFilterMinBpm, setTrackFilterMinBpm] = useState('')
  const [trackFilterMaxBpm, setTrackFilterMaxBpm] = useState('')
  const [trackFilterKey, setTrackFilterKey] = useState('')
  const [filteringTracks, setFilteringTracks] = useState(false)
  const [versionDialogOpen, setVersionDialogOpen] = useState(false)
  const [versionTrack, setVersionTrack] = useState<Track | null>(null)
  const [trackVersions, setTrackVersions] = useState<TrackVersionRecord[]>([])
  const [activeVersionId, setActiveVersionId] = useState('')
  const [versionName, setVersionName] = useState('')
  const [versionBpm, setVersionBpm] = useState('')
  const [versionKey, setVersionKey] = useState<string>(trackKeyOptions[0].value)
  const [versionDuration, setVersionDuration] = useState(0)
  const [versionFile, setVersionFile] = useState<File | null>(null)
  const [versionSaving, setVersionSaving] = useState(false)
  const [versionToDelete, setVersionToDelete] = useState<TrackVersionRecord | null>(null)
  const versionFileRef = useRef<HTMLInputElement>(null)

  async function fetchProjectTracks(projectId: string) {
    const trackList = await trackWebhook.findByProject(projectId)

    return Promise.all(
      trackList.map(async (track) => {
        const latestVersion = track.versions?.find((version) => version.id === track.activeVersionId) ?? track.versions?.[0]
        let src = ''

        try {
          const fileUrl = await trackWebhook.getFileUrl(track.id)
          src = fileUrl.url
        } catch {
          src = ''
        }

        const fileSize = Number(latestVersion?.fileSize ?? track.fileSize ?? 0)
        const totalSizeMB = (track.versions ?? []).reduce(
          (sum, version) => sum + Number(version.fileSize ?? 0) / (1024 * 1024),
          0,
        )
        const mimeType = latestVersion?.mimeType ?? track.mimeType ?? ''

        return {
          id: track.id,
          name: latestVersion?.name ?? track.name,
          format: (mimeType.includes('wav') ? 'wav' : 'mp3') as Track['format'],
          duration: Number(latestVersion?.duration ?? track.duration ?? 0),
          sizeMB: Number.isFinite(fileSize) ? fileSize / (1024 * 1024) : 0,
          totalSizeMB,
          bpm: latestVersion?.bpm ?? track.bpm ?? 0,
          key: formatTrackKey(latestVersion?.key ?? track.key),
          addedAt: track.createdAt ?? new Date().toISOString(),
          src,
        } satisfies Track
      }),
    )
  }

  useEffect(() => {
    async function loadProject() {
      const userId = localStorage.getItem('userId')

      if (!userId) {
        toast.error('Usuário não autenticado')
        setLoading(false)
        return
      }

      try {
        let selected: Project | undefined = await projectWebhook.findById(params.id)

        if (!selected) {
          const all = await projectWebhook.findAll()

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
          createAt: selected.createdAt ?? selected.createAt ?? '',
          updateAt: selected.updatedAt ?? selected.updateAt ?? '',
          size: selected.size ?? 0,
          tracks: [],
        }

        const projectTracks = await fetchProjectTracks(mappedProject.id)

        mappedProject.tracks = projectTracks
        mappedProject.size = projectTracks.reduce((total, track) => total + (track.totalSizeMB ?? track.sizeMB), 0)

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

    if (!userId) return

    try {
      setSaving(true)

      await projectWebhook.update(project.id, {
        name: name.trim(),
        description: description.trim() || undefined,
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

    if (!userId) return

    const previousColor = project.color
    setProject((prev) => (prev ? { ...prev, color } : prev))

    try {
      await projectWebhook.update(projectId, {
        color,
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
    if (!userId) return

    const projectTracks = await fetchProjectTracks(project.id)
    setTracks(projectTracks)
    setProject((prev) => (prev ? { ...prev, tracks: projectTracks } : prev))
  }

  async function openNewVersion(track: Track) {
    try {
      const response = await trackWebhook.findById(track.id)
      setVersionTrack(track)
      setTrackVersions(response.versions ?? [])
      setActiveVersionId(response.activeVersionId ?? response.versions?.[0]?.id ?? '')
      setVersionName(`v${(response.versions?.length ?? 0) + 1}`)
      setVersionBpm(String(track.bpm || ''))
      setVersionKey(normalizeTrackKey(track.key) || trackKeyOptions[0].value)
      setVersionDuration(track.duration || 0)
      setVersionFile(null)
      setVersionDialogOpen(true)
    } catch (error) {
      toast.error('Não foi possível carregar as versões', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  async function saveNewVersion() {
    if (!versionTrack || !versionFile || !versionName.trim()) {
      toast.error('Informe o nome e o arquivo da nova versão.')
      return
    }

    try {
      setVersionSaving(true)
      const created = await trackWebhook.attachFile({
        trackId: versionTrack.id,
        file: versionFile,
        versionName: versionName.trim(),
        duration: Math.round(versionDuration),
        bpm: Number(versionBpm) || undefined,
        key: normalizeTrackKey(versionKey),
      })
      const createdVersion = created.versions?.[0]
      const nextActiveVersionId = activeVersionId === 'new'
        ? createdVersion?.id
        : activeVersionId || createdVersion?.id

      if (nextActiveVersionId && nextActiveVersionId !== created.activeVersionId) {
        await trackWebhook.setActiveVersion(versionTrack.id, nextActiveVersionId)
      }

      await refreshTracks()
      setVersionDialogOpen(false)
      toast.success('Nova versão criada')
    } catch (error) {
      toast.error('Não foi possível criar a versão', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setVersionSaving(false)
    }
  }

  async function activateSelectedVersion() {
    if (!versionTrack || !activeVersionId || activeVersionId === 'new') return

    try {
      setVersionSaving(true)
      await trackWebhook.setActiveVersion(versionTrack.id, activeVersionId)
      await refreshTracks()
      setVersionDialogOpen(false)
      toast.success('Versão ativa atualizada')
    } catch (error) {
      toast.error('Não foi possível ativar a versão', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setVersionSaving(false)
    }
  }

  async function deleteTrackVersion(version: TrackVersionRecord) {
    if (!versionTrack) return

    try {
      setVersionSaving(true)
      await trackWebhook.deleteVersion(versionTrack.id, version.id)
      const response = await trackWebhook.findById(versionTrack.id)
      setTrackVersions(response.versions ?? [])
      setActiveVersionId(response.activeVersionId ?? response.versions?.[0]?.id ?? '')
      await refreshTracks()
      setVersionToDelete(null)
      toast.success('Versão excluída')
    } catch (error) {
      toast.error('Não foi possível excluir a versão', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setVersionSaving(false)
    }
  }

  async function filterProjectTracks() {
    if (!project) return

    try {
      setFilteringTracks(true)
      const filteredTracks = await projectWebhook.filterTracksByProjectId(project.id, {
        name: trackFilterName.trim() || undefined,
        minBpm: trackFilterMinBpm ? Number(trackFilterMinBpm) : undefined,
        maxBpm: trackFilterMaxBpm ? Number(trackFilterMaxBpm) : undefined,
        key: trackFilterKey || undefined,
      })

      const mappedTracks = await Promise.all(
        filteredTracks.map(async (track) => {
          const latestVersion = track.versions?.find((version) => version.id === track.activeVersionId)
            ?? track.versions?.[0]
          let src = ''

          try {
            src = (await trackWebhook.getFileUrl(track.id)).url
          } catch {
            src = ''
          }

          const fileSize = Number(latestVersion?.fileSize ?? track.fileSize ?? 0)
          const mimeType = latestVersion?.mimeType ?? track.mimeType ?? ''

          return {
            id: track.id,
            name: track.name,
            format: (mimeType.includes('wav') ? 'wav' : 'mp3') as Track['format'],
            duration: Number(latestVersion?.duration ?? track.duration ?? 0),
            sizeMB: Number.isFinite(fileSize) ? fileSize / (1024 * 1024) : 0,
            bpm: latestVersion?.bpm ?? track.bpm ?? 0,
            key: formatTrackKey(latestVersion?.key ?? track.key),
            addedAt: track.createdAt ?? new Date().toISOString(),
            src,
          } satisfies Track
        }),
      )

      setTracks(mappedTracks)
      setProject((prev) => (prev ? { ...prev, tracks: mappedTracks } : prev))
      setTrackFilterOpen(false)
    } catch (error) {
      toast.error('Não foi possível filtrar as faixas', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setFilteringTracks(false)
    }
  }

  async function clearTrackFilters() {
    setTrackFilterName('')
    setTrackFilterMinBpm('')
    setTrackFilterMaxBpm('')
    setTrackFilterKey('')
    await refreshTracks()
    setTrackFilterOpen(false)
  }

  async function openTrackEditDialog(track: Track) {
    try {
      const response = await trackWebhook.findById(track.id)
      const versions = response.versions ?? []
      const activeId = response.activeVersionId ?? versions[0]?.id ?? ''
      const activeVersion = versions.find((version) => version.id === activeId) ?? versions[0]

      setTrackEditActiveVersionId(activeId)
      setTrackToEdit(track)
      setTrackEditName(activeVersion?.name ?? track.versionName ?? track.name)
      setTrackEditBpm(String(activeVersion?.bpm ?? track.bpm ?? ''))
      setTrackEditKey(normalizeTrackKey(activeVersion?.key ?? track.key) || trackKeyOptions[0].value)
      setTrackEditOpen(true)
    } catch (error) {
      toast.error('Não foi possível carregar as versões', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }

  function openTrackDeleteDialog(track: Track) {
    setTrackToEdit(track)
    setTrackDeleteOpen(true)
  }

  async function handleUpdateTrack(e: React.FormEvent) {
    e.preventDefault()

    if (!trackToEdit) return

    const userId = localStorage.getItem('userId')

    if (!userId) {
      toast.error('Usuário não autenticado')
      return
    }

    try {
      setTrackEditSaving(true)

      if (trackEditActiveVersionId) {
        await trackWebhook.setActiveVersion(trackToEdit.id, trackEditActiveVersionId)
      }

      await trackWebhook.update({
        trackId: trackToEdit.id,
        track: {
          bpm: Number(trackEditBpm) || undefined,
          key: normalizeTrackKey(trackEditKey.trim()) || undefined,
          versionName: trackEditName.trim() || undefined,
        },
      })

      await refreshTracks()

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

    if (!userId) {
      toast.error('Usuário não autenticado')
      return
    }

    try {
      setTrackDeleting(true)

      await trackWebhook.delete(trackToEdit.id)

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

    if (!userId) return

    try {
      setDeleting(true)

      await projectWebhook.delete(project.id)

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

  async function handleCreateShareLink() {
    if (!project) return

    const userId = localStorage.getItem('userId')

    if (!userId) {
      toast.error('Usuário não autenticado')
      return
    }

    try {
      setCreatingShareLink(true)

      const response = await projectWebhook.createShareLink(project.id, {
        permission: sharePermission,
        expiresAt: shareExpiresAt ? new Date(shareExpiresAt).toISOString() : undefined,
      })

      setShareLink(response.url ?? '')
      const token = response.url?.split('/').pop()
      if (token) {
        const stored = JSON.parse(localStorage.getItem('sharedProjects') ?? '[]') as Array<Record<string, unknown>>
        const next = stored.filter((item) => item.token !== token)
        localStorage.setItem('sharedProjects', JSON.stringify([
          { token, name: project.name, projectId: project.id, shareLinkId: response.id, expiresAt: response.expiresAt },
          ...next,
        ]))
      }
      toast.success('Link de compartilhamento criado')
    } catch (error) {
      toast.error('Não foi possível criar o link de compartilhamento', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setCreatingShareLink(false)
    }
  }

  async function handleCopyShareLink() {
    if (!shareLink) return

    try {
      setCopyingShareLink(true)
      await navigator.clipboard.writeText(shareLink)
      toast.success('Link copiado para a área de transferência')
    } catch (error) {
      toast.error('Não foi possível copiar o link', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setCopyingShareLink(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando projeto...</p>
  }

  if (!project) {
    return <p className="text-sm text-muted-foreground">Projeto não encontrado.</p>
  }

  const totalSeconds = project.tracks.reduce((s, t) => s + t.duration, 0)
  const totalSizeMB = project.tracks.reduce((sum, track) => sum + (track.totalSizeMB ?? track.sizeMB), 0)

  const stats = [
    { label: 'Faixas', value: `${project.tracks.length}`, icon: Music },
    { label: 'Duração', value: formatTime(totalSeconds), icon: Clock },
    { label: 'Tamanho', value: `${totalSizeMB.toFixed(2)} MB`, icon: HardDrive },
  ]

  console.log('project', project)

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

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <ColorPickerPopover
              selectedColor={project.color}
              onSelectColor={(newColor) => {
                handleUpdateProjectColor(project.id, newColor)
              }}
            />
            <div>
              <h1 className="break-words text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{project.name}</h1>
              <p className="mt-1 max-w-xl break-words text-sm text-muted-foreground">{project.description}</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Atualizado em {formatDate(project.updateAt ?? project.createAt)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger render={<Button variant="outline" size="default" />}>
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

            <Dialog open={shareOpen} onOpenChange={setShareOpen}>
              <DialogTrigger render={<Button variant="outline" size="default" />}>
                <UploadCloud className="size-4" />
                Compartilhar
              </DialogTrigger>
              <DialogContent className="max-w-md gap-5 p-5 sm:p-6">
                <DialogHeader>
                  <DialogTitle>Compartilhar projeto</DialogTitle>
                  <DialogDescription>
                    Defina a permissão do link e copie o acesso compartilhado.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="share-permission">Permissão</Label>
                    <div className="relative">
                      <select
                        id="share-permission"
                        value={sharePermission}
                        onChange={(e) => setSharePermission(e.target.value as 'READ' | 'DOWNLOAD' | 'EDIT')}
                        className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 [&>option]:bg-popover [&>option]:text-popover-foreground"
                      >
                        <option value="READ">Leitura</option>
                        <option value="DOWNLOAD">Download</option>
                        <option value="EDIT">Edição</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="share-expiration">Expira em (opcional)</Label>
                    <Input
                      id="share-expiration"
                      type="datetime-local"
                      value={shareExpiresAt}
                      onChange={(e) => setShareExpiresAt(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="share-link">Link</Label>
                    <Input
                      id="share-link"
                      value={shareLink}
                      readOnly
                      placeholder="Gere um link para copiar"
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setShareOpen(false)}>
                    Fechar
                  </Button>
                  {!shareLink ? (
                    <Button type="button" className="w-full sm:w-auto" onClick={handleCreateShareLink} disabled={creatingShareLink}>
                      {creatingShareLink ? 'Gerando...' : 'Gerar link'}
                    </Button>
                  ) : (
                    <>
                      <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={handleCreateShareLink} disabled={creatingShareLink}>
                        {creatingShareLink ? 'Atualizando...' : 'Atualizar link'}
                      </Button>
                      <Button type="button" className="w-full sm:w-auto" onClick={handleCopyShareLink} disabled={copyingShareLink}>
                        {copyingShareLink ? 'Copiando...' : 'Copiar link'}
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger render={<Button variant="destructive" size="default" />}>
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

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
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

        <div className="mt-8 mb-24">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium">Faixas</h2>
            <Dialog open={trackFilterOpen} onOpenChange={setTrackFilterOpen}>
              <DialogTrigger render={<Button variant="outline" size="sm" />}>
                <Filter className="size-4" />
                Filtrar
              </DialogTrigger>
              <DialogContent className="max-w-md max-sm:max-h-[90vh] max-sm:overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Filtrar faixas</DialogTitle>
                  <DialogDescription>Use os filtros para encontrar faixas deste projeto.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="track-filter-name">Nome</Label>
                    <Input id="track-filter-name" value={trackFilterName} onChange={(e) => setTrackFilterName(e.target.value)} placeholder="Nome da faixa" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="track-filter-min-bpm">BPM mínimo</Label>
                      <Input id="track-filter-min-bpm" type="number" min="0" value={trackFilterMinBpm} onChange={(e) => setTrackFilterMinBpm(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="track-filter-max-bpm">BPM máximo</Label>
                      <Input id="track-filter-max-bpm" type="number" min="0" value={trackFilterMaxBpm} onChange={(e) => setTrackFilterMaxBpm(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="track-filter-key">Tom</Label>
                    <select
                      id="track-filter-key"
                      value={trackFilterKey}
                      onChange={(e) => setTrackFilterKey(e.target.value)}
                      className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent dark:bg-input/30 px-2.5 py-1 text-sm text-foreground transition-colors outline-none appearance-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-transparent disabled:opacity-50"
                    >
                      <option value="" className="bg-input text-foreground">
                        Todos os tons
                      </option>
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
                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={clearTrackFilters}>Limpar</Button>
                  <Button type="button" className="w-full sm:w-auto" onClick={filterProjectTracks} disabled={filteringTracks}>
                    {filteringTracks ? 'Filtrando...' : 'Aplicar filtros'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <TrackPlayer tracks={tracks} remote onEditTrack={openTrackEditDialog} onDeleteTrack={openTrackDeleteDialog} onNewVersion={openNewVersion} />
        </div>

        <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova versão da track</DialogTitle>
              <DialogDescription>Envie um novo arquivo e escolha qual versão ficará ativa.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              {versionFile && (
                <>
              <div className="space-y-2">
                <Label htmlFor="version-name">Nome da nova track</Label>
                <Input id="version-name" value={versionName} onChange={(e) => setVersionName(e.target.value)} placeholder="v2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="version-bpm">BPM</Label>
                  <Input id="version-bpm" type="number" min="1" value={versionBpm} onChange={(e) => setVersionBpm(e.target.value)} placeholder="120" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="version-key">Key</Label>
                  <select id="version-key" value={versionKey} onChange={(e) => setVersionKey(e.target.value)} className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent dark:bg-input/30 px-2.5 py-1 text-sm text-foreground transition-colors outline-none appearance-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                    {trackKeyOptions.map((option) => <option key={option.value} value={option.value} className="bg-input text-foreground">{option.label}</option>)}
                  </select>
                </div>
              </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Arquivo da nova versão</Label>
                <button
                  type="button"
                  onClick={() => versionFileRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-7 text-center transition-colors hover:border-foreground/30"
                >
                  <UploadCloud className="size-6 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {versionFile?.name ?? 'Clique para selecionar um arquivo'}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">MP3 ou WAV</span>
                </button>
                <Input
                  ref={versionFileRef}
                  id="version-file"
                  type="file"
                  accept=".mp3,.wav,audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setVersionFile(file)
                    if (file) setActiveVersionId('new')
                    if (file) {
                      const audio = new Audio()
                      const url = URL.createObjectURL(file)
                      audio.onloadedmetadata = () => {
                        setVersionDuration(audio.duration || 0)
                        URL.revokeObjectURL(url)
                      }
                      audio.src = url
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Versões existentes</Label>
                <div className="grid max-h-40 gap-2 overflow-y-auto">
                  {trackVersions.map((version) => {
                    const isActive = activeVersionId === version.id
                    return (
                      <div
                        role="button"
                        tabIndex={0}
                        key={version.id}
                        onClick={() => setActiveVersionId(version.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setActiveVersionId(version.id)
                          }
                        }}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${isActive
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-muted/30 hover:bg-muted/60'
                          }`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">{version.name}</span>
                          <span className="block text-xs text-muted-foreground">
                            {version.bpm ?? '—'} BPM · {formatTrackKey(version.key)}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {isActive && <Check className="size-4 text-primary" />}
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-xs"
                            aria-label={`Excluir versão ${version.name}`}
                            onClick={(event) => {
                              event.stopPropagation()
                              setVersionToDelete(version)
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVersionDialogOpen(false)}>Cancelar</Button>
              {versionFile ? (
                <Button type="button" onClick={saveNewVersion} disabled={versionSaving}>
                  {versionSaving ? 'Criando...' : 'Criar nova versão'}
                </Button>
              ) : (
                <Button type="button" onClick={activateSelectedVersion} disabled={versionSaving || !activeVersionId || activeVersionId === 'new'}>
                  {versionSaving ? 'Salvando...' : 'Usar esta versão'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={versionToDelete !== null} onOpenChange={(open) => !open && setVersionToDelete(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Excluir versão</DialogTitle>
              <DialogDescription>
                A versão <strong>{versionToDelete?.name}</strong> será removida permanentemente.
                Essa ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVersionToDelete(null)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => versionToDelete && deleteTrackVersion(versionToDelete)}
                disabled={versionSaving}
              >
                {versionSaving ? 'Excluindo...' : 'Excluir versão'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={trackEditOpen} onOpenChange={setTrackEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar faixa</DialogTitle>
              <DialogDescription>Atualize o título, BPM, tom ou versão desta faixa.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateTrack} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="track-edit-name">Nome da versão ativa</Label>
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