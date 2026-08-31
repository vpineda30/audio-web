'use client'

import { ArrowLeft, Check, Clock, Download, HardDrive, Lock, MoreHorizontal, Music, Pause, Play, ShieldCheck, SkipBack, SkipForward, Trash2, UploadCloud, Volume2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { UploadTrackDialog } from '@/components/upload-track-dialog'
import { API_URL } from '@/hooks/api/api'
import { projectWebhook } from '@/hooks/api/Projects.webhook'
import { formatDate, formatFileSize, formatTime, formatTrackKey, normalizeTrackKey, trackKeyOptions } from '@/lib/data'

type SharedTrack = {
    id: string
    name: string
    activeVersionId?: string | null
    versions?: Array<{
        id: string
        name?: string
        duration?: number | null
        bpm?: number | null
        key?: string | null
        fileSize?: string | number | null
    }>
    duration?: number
    bpm?: number
    key?: string
    sizeMB?: number
    src?: string
}

type SharedProject = {
    id: string
    name: string
    description?: string | null
    updateAt?: string | null
    tracks: SharedTrack[]
    permission: 'READ' | 'DOWNLOAD' | 'EDIT'
    expiresAt?: string | null
    updatedAt?: string | null
}

function normalizeTrack(track: SharedTrack) {
    const version = track.versions?.find((item) => item.id === track.activeVersionId) ?? track.versions?.[0]
    const fileSizes = track.versions?.map((item) => Number(item.fileSize ?? 0)) ?? []
    const totalFileSize = fileSizes.length > 0
        ? fileSizes.reduce((total, size) => total + size, 0)
        : Number(version?.fileSize ?? 0)

    return {
        name: version?.name ?? track.name,
        duration: Number(version?.duration ?? track.duration ?? 0),
        bpm: Number(version?.bpm ?? track.bpm ?? 0),
        key: version?.key ?? track.key ?? '—',
        sizeMB: totalFileSize / (1024 * 1024),
    }
}

function formatExpirationDate(value: string | null | undefined) {
    if (!value) return null

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toLocaleString('pt-BR')
}

export default function SharedProjectPage() {
    const router = useRouter()
    const { token } = useParams<{ token: string }>()
    const audioRef = useRef<HTMLAudioElement>(null)
    const versionFileRef = useRef<HTMLInputElement>(null)
    const [project, setProject] = useState<SharedProject | null>(null)
    const [loading, setLoading] = useState(true)
    const [currentTrackId, setCurrentTrackId] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [downloadingTrackId, setDownloadingTrackId] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)
    const [playerDuration, setPlayerDuration] = useState(0)
    const [volume, setVolume] = useState(50)
    const [versionsTrack, setVersionsTrack] = useState<SharedTrack | null>(null)
    const [editingTrack, setEditingTrack] = useState<SharedTrack | null>(null)
    const [removingTrack, setRemovingTrack] = useState<SharedTrack | null>(null)
    const [editName, setEditName] = useState('')
    const [editBpm, setEditBpm] = useState('')
    const [editKey, setEditKey] = useState('C')
    const [editSaving, setEditSaving] = useState(false)
    const [trackRemoving, setTrackRemoving] = useState(false)
    const [versionFile, setVersionFile] = useState<File | null>(null)
    const [versionName, setVersionName] = useState('')
    const [versionBpm, setVersionBpm] = useState('')
    const [versionKey, setVersionKey] = useState('C')
    const [versionDuration, setVersionDuration] = useState(0)
    const [activeVersionId, setActiveVersionId] = useState('')
    const [versionSaving, setVersionSaving] = useState(false)
    const [versionToDelete, setVersionToDelete] = useState<{ id: string; name?: string } | null>(null)

    const totals = useMemo(() => {
        if (!project) return { duration: 0, size: 0 }
        return project.tracks.reduce((total, track) => {
            const normalized = normalizeTrack(track)
            return { duration: total.duration + normalized.duration, size: total.size + normalized.sizeMB }
        }, { duration: 0, size: 0 })
    }, [project])

    useEffect(() => {
        setIsAuthenticated(Boolean(localStorage.getItem('userId')))

        if (!token) {
            setLoading(false)
            return
        }

        projectWebhook.getSharedProject(token)
            .then((response) => {
                setProject(response)
                const stored = JSON.parse(localStorage.getItem('sharedProjects') ?? '[]') as Array<{ token: string }>
                const next = stored.filter((item) => item.token !== token)
                localStorage.setItem('sharedProjects', JSON.stringify([{ token, name: response.name }, ...next]))
            })
            .catch((error) => {
                setProject(null)
                toast.error('Link inválido ou expirado', { description: error instanceof Error ? error.message : 'Tente novamente.' })
            })
            .finally(() => setLoading(false))
    }, [token])

    async function refreshSharedProject() {
        const response = await projectWebhook.getSharedProject(token)
        setProject(response)
    }

    function requireAuthentication() {
        if (isAuthenticated) return true

        router.push(`/login?redirect=${encodeURIComponent(`/share/${token}`)}`)
        return false
    }

    function openVersions(track: SharedTrack) {
        const versions = track.versions ?? []
        const activeId = track.activeVersionId ?? versions[0]?.id ?? ''
        const activeVersion = versions.find((version) => version.id === activeId) ?? versions[0]
        setVersionsTrack(track)
        setActiveVersionId(activeId)
        setVersionName(`v${versions.length + 1}`)
        setVersionBpm(String(activeVersion?.bpm ?? track.bpm ?? ''))
        setVersionKey(normalizeTrackKey(activeVersion?.key ?? track.key ?? 'C') || 'C')
        setVersionDuration(Number(activeVersion?.duration ?? track.duration ?? 0))
        setVersionFile(null)
    }

    async function saveSharedVersion() {
        if (!requireAuthentication()) return

        if (!versionsTrack || !versionFile || !versionName.trim()) {
            toast.error('Informe o nome e o arquivo da nova versão.')
            return
        }

        try {
            setVersionSaving(true)
            const created = await projectWebhook.createSharedTrackVersion(token, versionsTrack.id, {
                versionName: versionName.trim(),
                duration: Math.round(versionDuration),
                bpm: Number(versionBpm) || undefined,
                key: normalizeTrackKey(versionKey),
                file: versionFile,
            })
            const createdVersion = created.versions?.[0]
            if (createdVersion?.id) {
                await projectWebhook.setSharedActiveVersion(token, versionsTrack.id, createdVersion.id)
            }
            await refreshSharedProject()
            setVersionsTrack(null)
            toast.success('Nova versão criada')
        } catch (error) {
            toast.error('Não foi possível criar a versão', { description: error instanceof Error ? error.message : 'Tente novamente.' })
        } finally {
            setVersionSaving(false)
        }
    }

    async function activateSharedVersion() {
        if (!requireAuthentication()) return

        if (!versionsTrack || !activeVersionId) return
        try {
            setVersionSaving(true)
            await projectWebhook.setSharedActiveVersion(token, versionsTrack.id, activeVersionId)
            await refreshSharedProject()
            setVersionsTrack(null)
            toast.success('Versão ativa atualizada')
        } catch (error) {
            toast.error('Não foi possível ativar a versão', { description: error instanceof Error ? error.message : 'Tente novamente.' })
        } finally {
            setVersionSaving(false)
        }
    }

    async function deleteSharedVersion() {
        if (!requireAuthentication()) return

        if (!versionsTrack || !versionToDelete) return
        try {
            setVersionSaving(true)
            await projectWebhook.deleteSharedTrackVersion(token, versionsTrack.id, versionToDelete.id)
            await refreshSharedProject()
            setVersionToDelete(null)
            toast.success('Versão excluída')
        } catch (error) {
            toast.error('Não foi possível excluir a versão', { description: error instanceof Error ? error.message : 'Tente novamente.' })
        } finally {
            setVersionSaving(false)
        }
    }

    useEffect(() => {
        if (!project || !currentTrackId || !isPlaying || !audioRef.current) return
        const track = project.tracks.find((item) => item.id === currentTrackId)
        if (!track) return

        const play = async () => {
            const response = track.src
                ? { url: track.src }
                : await projectWebhook.getSharedTrackPreviewUrl(token, track.id).catch(() => null)

            if (!response?.url || !audioRef.current) {
                setCurrentTrackId(null)
                setIsPlaying(false)
                toast.error('Áudio indisponível para esta faixa.')
                return
            }

            track.src = response.url
            audioRef.current.src = response.url
            audioRef.current.load()
            await audioRef.current.play().catch(() => setIsPlaying(false))
        }

        play()
    }, [currentTrackId, project, token])

    function togglePlayback(track: SharedTrack) {
        if (currentTrackId === track.id && isPlaying) {
            audioRef.current?.pause()
            setIsPlaying(false)
            return
        }

        if (currentTrackId === track.id && audioRef.current) {
            audioRef.current.play().catch(() => setIsPlaying(false))
            setIsPlaying(true)
            return
        }

        setCurrentTrackId(track.id)
        setIsPlaying(true)
    }

    function selectAdjacentTrack(direction: 1 | -1) {
        if (!project || project.tracks.length === 0) return
        const currentIndex = project.tracks.findIndex((track) => track.id === currentTrackId)
        const nextIndex = currentIndex < 0
            ? 0
            : (currentIndex + direction + project.tracks.length) % project.tracks.length
        setCurrentTrackId(project.tracks[nextIndex].id)
        setIsPlaying(true)
    }

    function seek(value: number | readonly number[]) {
        const nextProgress = Array.isArray(value) ? value[0] : value
        if (audioRef.current && playerDuration) {
            audioRef.current.currentTime = (nextProgress / 100) * playerDuration
        }
        setProgress(nextProgress)
    }

    function changeVolume(value: number | readonly number[]) {
        const nextVolume = Array.isArray(value) ? value[0] : value
        setVolume(nextVolume)
        if (audioRef.current) audioRef.current.volume = nextVolume / 100
    }

    async function downloadTrack(trackId: string) {
        try {
            setDownloadingTrackId(trackId)
            const track = project?.tracks.find((item) => item.id === trackId)
            const fileName = normalizeTrack(track ?? { id: trackId, name: 'track' }).name || 'track'
            const response = await fetch(`${API_URL}/share/${encodeURIComponent(token)}/tracks/${encodeURIComponent(trackId)}/download`, {
                cache: 'no-store',
                credentials: 'include',
            })

            if (!response.ok) throw new Error('Falha ao carregar o arquivo para download.')

            const blob = await response.blob()
            const objectUrl = URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = objectUrl
            anchor.download = `${fileName.replace(/[\\/:*?\"<>|]/g, '-').trim() || 'track'}.${blob.type.includes('wav') ? 'wav' : 'mp3'}`
            anchor.style.display = 'none'
            document.body.appendChild(anchor)
            anchor.click()
            document.body.removeChild(anchor)
            URL.revokeObjectURL(objectUrl)
        } catch (error) {
            toast.error('Não foi possível baixar a faixa.', { description: error instanceof Error ? error.message : 'Tente novamente.' })
        } finally {
            setDownloadingTrackId(null)
        }
    }

    function openEditTrack(track: SharedTrack) {
        const normalized = normalizeTrack(track)
        setEditingTrack(track)
        setEditName(track.name)
        setEditBpm(String(normalized.bpm || ''))
        setEditKey(normalized.key === '—' ? 'C' : normalizeTrackKey(normalized.key))
    }

    async function saveTrackEdit() {
        if (!requireAuthentication()) return

        if (!editingTrack || !editName.trim()) return

        try {
            setEditSaving(true)
            await projectWebhook.updateSharedTrack(token, editingTrack.id, {
                name: editName.trim(),
                bpm: editBpm ? Number(editBpm) : undefined,
                key: normalizeTrackKey(editKey),
            })
            await refreshSharedProject()
            setEditingTrack(null)
            toast.success('Faixa atualizada')
        } catch (error) {
            toast.error('Não foi possível editar a faixa', { description: error instanceof Error ? error.message : 'Tente novamente.' })
        } finally {
            setEditSaving(false)
        }
    }

    async function removeTrack() {
        if (!requireAuthentication()) return

        if (!removingTrack) return

        try {
            setTrackRemoving(true)
            await projectWebhook.deleteSharedTrack(token, removingTrack.id)
            await refreshSharedProject()
            setRemovingTrack(null)
            if (currentTrackId === removingTrack.id) {
                audioRef.current?.pause()
                setCurrentTrackId(null)
                setIsPlaying(false)
            }
            toast.success('Faixa removida')
        } catch (error) {
            toast.error('Não foi possível remover a faixa', { description: error instanceof Error ? error.message : 'Tente novamente.' })
        } finally {
            setTrackRemoving(false)
        }
    }

    async function uploadSharedTrack(data: { name: string; bpm: number; key: string; duration: number; file: File }) {
        if (!requireAuthentication()) return false

        await projectWebhook.createSharedTrack(token, {
            ...data,
            versionName: data.name,
        })
        await refreshSharedProject()
        return true
    }

    if (loading) {
        return <main className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground sm:px-6 lg:px-8">Carregando projeto...</main>
    }

    if (!project) {
        return (
            <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Compartilhamento</p>
                <h1 className="text-2xl font-semibold">Link inválido ou expirado</h1>
                <Button onClick={() => router.push('/')}>Voltar para a home</Button>
            </main>
        )
    }

    const canDownload = project.permission === 'DOWNLOAD' || project.permission === 'EDIT'
    const canEdit = project.permission === 'EDIT'
    const currentTrack = project.tracks.find((track) => track.id === currentTrackId)
    const expirationLabel = formatExpirationDate(project.expiresAt)

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 pb-28 sm:px-6 lg:px-8 mt-8">
            {isAuthenticated && (
                <Button type="button" variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="-ml-2 w-fit text-muted-foreground">
                    <ArrowLeft className="size-4" /> Voltar
                </Button>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
                        <p className="mt-1 max-w-xl text-sm text-muted-foreground">{project.description || 'Sem descrição'}</p>
                        <p className="mt-2 font-mono text-xs text-muted-foreground">
                            {expirationLabel ? `Link expira em ${expirationLabel}` : `Compartilhado${(project.updatedAt ?? project.updateAt) ? ` · Atualizado em ${formatDate(project.updatedAt ?? project.updateAt)}` : ''}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-fit rounded-full border border-border bg-muted/60 px-3 py-1 mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{project.permission}</span>
                    {canEdit && <UploadTrackDialog projectName={project.name} onUpload={uploadSharedTrack} />}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                    { label: 'Faixas', value: project.tracks.length, icon: Music },
                    { label: 'Duração', value: formatTime(totals.duration), icon: Clock },
                    { label: 'Tamanho', value: formatFileSize(totals.size), icon: HardDrive },
                ].map((stat) => (
                    <Card key={stat.label} className="gap-0 p-5">
                        <div className="flex items-center justify-between"><span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</span><stat.icon className="size-4 text-muted-foreground" /></div>
                        <span className="mt-4 text-2xl font-semibold tracking-tight">{stat.value}</span>
                    </Card>
                ))}
            </div>

            <div>
                <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-medium">Faixas</h2><span className="text-xs text-muted-foreground"><Music className="mr-1 inline size-3.5" />{project.tracks.length}</span></div>
                <div className="divide-y divide-border rounded-xl border border-border bg-card">
                    {project.tracks.map((track) => {
                        const normalized = normalizeTrack(track)
                        const trackIsPlaying = currentTrackId === track.id && isPlaying
                        return (
                            <div key={track.id} className="flex items-center gap-4 px-4 py-3 sm:px-5">
                                <Button variant={trackIsPlaying ? 'default' : 'secondary'} size="icon" className="size-9 shrink-0 rounded-full" onClick={() => togglePlayback(track)} aria-label={trackIsPlaying ? 'Pausar' : 'Reproduzir'}>{trackIsPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}</Button>
                                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{normalized.name}</p><p className="truncate font-mono text-xs text-muted-foreground">{normalized.bpm} BPM · {normalized.key} · {formatFileSize(normalized.sizeMB)}</p></div>
                                <span className="hidden w-12 text-right font-mono text-xs text-muted-foreground sm:block">{formatTime(normalized.duration)}</span>
                                {project.permission === 'READ' ? (
                                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                                        <Lock className="size-3.5" />
                                        Leitura
                                    </span>
                                ) : (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger
                                            render={<Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" />}
                                        >
                                            <MoreHorizontal className="size-4" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {canEdit && (
                                                <DropdownMenuItem onClick={() => openVersions(track)} className="bg-primary text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground">
                                                    Versões
                                                </DropdownMenuItem>
                                            )}
                                            {canDownload && (
                                                <DropdownMenuItem onClick={() => downloadTrack(track.id)}>
                                                    {downloadingTrackId === track.id ? 'Baixando...' : 'Baixar'}
                                                </DropdownMenuItem>
                                            )}
                                            {canEdit && (
                                                <>
                                                    <DropdownMenuItem onClick={() => openEditTrack(track)}>Editar</DropdownMenuItem>
                                                    <DropdownMenuItem variant="destructive" onClick={() => setRemovingTrack(track)}>Remover</DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
            
            <div className="flex justify-center">
                {isAuthenticated ? null : (
                    <Link href="/login?redirect=%2Fdashboard" className="text-sm font-medium underline-offset-4 hover:underline">
                        Já tem uma conta? Entrar
                    </Link>
                )}
            </div>

            <Dialog open={Boolean(versionsTrack)} onOpenChange={(open) => !open && setVersionsTrack(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nova versão da track</DialogTitle>
                        <DialogDescription>{versionsTrack?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        {versionFile && <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2"><Label htmlFor="shared-version-name">Nome da versão</Label><Input id="shared-version-name" value={versionName} onChange={(event) => setVersionName(event.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="shared-version-bpm">BPM</Label><Input id="shared-version-bpm" type="number" min="1" value={versionBpm} onChange={(event) => setVersionBpm(event.target.value)} /></div>
                        </div>}
                        {versionFile && <div className="space-y-2"><Label htmlFor="shared-version-key">Tom</Label><select id="shared-version-key" value={versionKey} onChange={(event) => setVersionKey(event.target.value)} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm">{trackKeyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>}
                        <div className="space-y-2">
                            <Label>Arquivo da nova versão</Label>
                            <button type="button" onClick={() => versionFileRef.current?.click()} className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-7 text-center transition-colors hover:border-foreground/30">
                                <UploadCloud className="size-6 text-muted-foreground" />
                                <span className="text-sm font-medium">{versionFile?.name ?? 'Clique para selecionar um arquivo'}</span>
                                <span className="font-mono text-xs text-muted-foreground">MP3 ou WAV</span>
                            </button>
                            <Input ref={versionFileRef} id="shared-version-file" type="file" accept=".mp3,.wav,audio/*" className="hidden" onChange={(event) => {
                                const file = event.target.files?.[0] ?? null
                                setVersionFile(file)
                                if (!file) return
                                const audio = new Audio()
                                const url = URL.createObjectURL(file)
                                audio.onloadedmetadata = () => { setVersionDuration(audio.duration || 0); URL.revokeObjectURL(url) }
                                audio.src = url
                            }} />
                        </div>
                        <div className="space-y-2">
                            <Label>Versões existentes</Label>
                            <div className="grid max-h-40 gap-2 overflow-y-auto">
                                {versionsTrack?.versions?.map((version) => {
                                    const isActive = activeVersionId === version.id
                                    return <div key={version.id} role="button" tabIndex={0} onClick={() => setActiveVersionId(version.id)} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left ${isActive ? 'border-primary bg-primary/10' : 'border-border bg-muted/30'}`}>
                                        <span><span className="block text-sm font-medium">{version.name || 'Versão sem nome'}</span><span className="block text-xs text-muted-foreground">{version.bpm ?? '—'} BPM · {formatTrackKey(version.key)} · {formatTime(Number(version.duration ?? 0))}</span></span>
                                        <span className="flex items-center gap-2">{isActive && <Check className="size-4 text-primary" />}<Button type="button" variant="destructive" size="icon-xs" aria-label={`Excluir versão ${version.name}`} onClick={(event) => { event.stopPropagation(); setVersionToDelete(version) }}><Trash2 className="size-3.5" /></Button></span>
                                    </div>
                                })}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setVersionsTrack(null)}>Cancelar</Button>
                        {versionFile ? <Button type="button" onClick={saveSharedVersion} disabled={versionSaving}>{versionSaving ? 'Criando...' : 'Criar nova versão'}</Button> : <Button type="button" onClick={activateSharedVersion} disabled={versionSaving || !activeVersionId}>{versionSaving ? 'Salvando...' : 'Usar esta versão'}</Button>}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(versionToDelete)} onOpenChange={(open) => !open && setVersionToDelete(null)}>
                <DialogContent className="max-w-sm">
                    <DialogHeader><DialogTitle>Excluir versão</DialogTitle><DialogDescription>A versão <strong>{versionToDelete?.name}</strong> será removida permanentemente.</DialogDescription></DialogHeader>
                    <DialogFooter><Button type="button" variant="outline" onClick={() => setVersionToDelete(null)}>Cancelar</Button><Button type="button" variant="destructive" onClick={deleteSharedVersion} disabled={versionSaving}>{versionSaving ? 'Excluindo...' : 'Excluir versão'}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(editingTrack)} onOpenChange={(open) => !open && setEditingTrack(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar faixa</DialogTitle>
                        <DialogDescription>Atualize os dados da faixa compartilhada.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="shared-track-name">Nome</Label>
                            <Input id="shared-track-name" value={editName} onChange={(event) => setEditName(event.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="shared-track-bpm">BPM</Label>
                                <Input id="shared-track-bpm" type="number" min="1" value={editBpm} onChange={(event) => setEditBpm(event.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="shared-track-key">Tom</Label>
                                <select id="shared-track-key" value={editKey} onChange={(event) => setEditKey(event.target.value)} className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent dark:bg-input/30 px-2.5 py-1 text-sm text-foreground transition-colors outline-none appearance-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                                    {trackKeyOptions.map((option) => <option key={option.value} className="bg-input text-foreground" value={option.value}>{option.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setEditingTrack(null)}>Cancelar</Button>
                        <Button type="button" onClick={saveTrackEdit} disabled={editSaving || !editName.trim()}>
                            {editSaving ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={Boolean(removingTrack)} onOpenChange={(open) => !open && setRemovingTrack(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remover faixa</DialogTitle>
                        <DialogDescription>Remover “{removingTrack?.name}” deste projeto compartilhado?</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setRemovingTrack(null)}>Cancelar</Button>
                        <Button type="button" variant="destructive" onClick={removeTrack} disabled={trackRemoving}>
                            {trackRemoving ? 'Removendo...' : 'Remover faixa'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <audio
                ref={audioRef}
                preload="none"
                onLoadedMetadata={(event) => setPlayerDuration(event.currentTarget.duration || 0)}
                onTimeUpdate={(event) => {
                    const audio = event.currentTarget
                    setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => selectAdjacentTrack(1)}
                className="hidden"
            />

            {currentTrack && (
                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
                        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted">
                            <Music className="size-4 text-muted-foreground" />
                        </span>
                        <div className="hidden min-w-0 w-36 sm:block">
                            <p className="truncate text-sm font-medium">{currentTrack.name}</p>
                            <p className="font-mono text-xs text-muted-foreground">COMPARTILHADO</p>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => selectAdjacentTrack(-1)} aria-label="Faixa anterior"><SkipBack className="size-4" /></Button>
                            <Button size="icon" className="rounded-full" onClick={() => togglePlayback(currentTrack)} aria-label={isPlaying ? 'Pausar faixa' : 'Reproduzir faixa'}>{isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}</Button>
                            <Button variant="ghost" size="icon" onClick={() => selectAdjacentTrack(1)} aria-label="Próxima faixa"><SkipForward className="size-4" /></Button>
                        </div>

                        <div className="flex flex-1 items-center gap-2 sm:gap-3">
                            <span className="hidden w-10 text-right font-mono text-xs text-muted-foreground sm:block">{formatTime((progress / 100) * playerDuration)}</span>
                            <Slider value={[progress]} onValueChange={seek} max={100} step={0.1} className="flex-1" />
                            <span className="w-10 font-mono text-xs text-muted-foreground">{formatTime(playerDuration)}</span>
                        </div>

                        <div className="hidden items-center gap-2 sm:flex">
                            <Button variant="ghost" size="icon" aria-label="Volume" onClick={() => changeVolume(volume ? 0 : 50)}><Volume2 className="size-4" /></Button>
                            <div className="w-24"><Slider value={[volume]} onValueChange={changeVolume} max={100} step={1} /></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
