'use client'

import { ArrowUpRight, Music, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { projectWebhook } from '@/hooks/api/Projects.webhook'
import { formatDate, type Project, type SharePermission, type Track } from '@/lib/data'

type ApiProject = {
  id?: string
  name: string
  description?: string | null
  duration?: number | null
  size?: number | null
  color?: string | null
  createdAt?: string
  updatedAt?: string
  tracks?: Array<{
    id: string
    name: string
    projectId?: string
    createdAt?: string
    updatedAt?: string
    versions?: Array<{
      id: string
      name: string
      duration?: number | null
      fileSize?: string | number
      mimeType?: string
      createdAt?: string
    }>
  }>
}

type SharedProjectCard = {
  token: string
  name: string
  projectId: string
  shareLinkId: string
  expiresAt?: string | null
  permission: SharePermission
}

const permissionLabels: Record<SharePermission, string> = {
  READ: 'Leitura',
  DOWNLOAD: 'Download',
  EDIT: 'Edição',
}

function mapTrack(track: NonNullable<ApiProject['tracks']>[number]): Track {
  const version = track.versions?.[0]
  const mimeType = version?.mimeType ?? ''
  const format = mimeType.includes('wav') ? 'wav' : 'mp3'

  return {
    id: track.id,
    name: track.name,
    format,
    duration: Number(version?.duration ?? 0),
    sizeMB: Number(version?.fileSize ?? 0) / (1024 * 1024),
    bpm: 0,
    key: '',
    addedAt: track.createdAt ?? '',
    src: '',
    versionName: version?.name,
  }
}

export function ProjectsGrid({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState('')
  const [projectList, setProjectList] = useState<Project[]>(projects)
  const [sharedProjectList, setSharedProjectList] = useState<SharedProjectCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deletingToken, setDeletingToken] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadProjects() {
      const userId = localStorage.getItem('userId')

      if (!userId) return

      try {
        setIsLoading(true)

        const response = await projectWebhook.findAll()

        if (!active) return

        const mappedProjects: Project[] = (response as ApiProject[]).map((project, index) => ({
          id: project.id ?? project.name ?? `project-${index}`,
          name: project.name,
          description: project.description ?? 'Sem Descrição',
          duration: project.duration,
          color: project.color || '#EF4444',
          size: project.size || 0,
          createAt: project.createdAt ?? '',
          updateAt: project.updatedAt ?? '',
          tracks: (project.tracks ?? []).map(mapTrack),
        }))

        setProjectList(mappedProjects.length > 0 ? mappedProjects : projects)

        const storedSharedProjects = JSON.parse(localStorage.getItem('sharedProjects') ?? '[]') as Array<{
          token?: string
          name?: string
          projectId?: string
          shareLinkId?: string
          expiresAt?: string | null
        }>
        const ownedProjects = mappedProjects.length > 0 ? mappedProjects : projects
        const linksByProject = await Promise.all(
          ownedProjects.map(async (project) => {
            try {
              return await projectWebhook.findShareLinks(project.id)
            } catch {
              return []
            }
          }),
        )
        
        const sharedCards = storedSharedProjects.flatMap((stored) => {
          if (!stored.token) return []
          const link = linksByProject.flat().find((item) => item.token === stored.token)
          if (!link?.id || !link.projectId) return []

          return [{
            token: stored.token,
            name: stored.name ?? 'Projeto compartilhado',
            projectId: link.projectId,
            shareLinkId: link.id,
            expiresAt: link.expiresAt,
            permission: link.permission,
          }]
        })
        setSharedProjectList(sharedCards)
      } catch (error) {
        if (!active) return

        setProjectList(projects)
        setSharedProjectList([])

        toast.error('Não foi possível carregar os projetos', {
          description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
        })
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadProjects()

    return () => {
      active = false
    }
  }, [projects])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projectList
    return projectList.filter(
      (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
    )
  }, [projectList, query])

  const filteredShared = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sharedProjectList
    return sharedProjectList.filter((project) => project.name.toLowerCase().includes(q))
  }, [sharedProjectList, query])

  async function deleteSharedProject(project: SharedProjectCard) {
    try {
      setDeletingToken(project.token)
      await projectWebhook.deleteShareLink(project.projectId, project.shareLinkId)
      setSharedProjectList((current) => current.filter((item) => item.token !== project.token))
      const stored = JSON.parse(localStorage.getItem('sharedProjects') ?? '[]') as Array<{ token?: string }>
      localStorage.setItem('sharedProjects', JSON.stringify(stored.filter((item) => item.token !== project.token)))
      toast.success('Link de compartilhamento desativado', { description: `O link de compartilhamento de "${project.name}" foi desativado.` })
    } catch (error) {
      toast.error('Não foi possível desativar o link', {
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
      })
    } finally {
      setDeletingToken(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar projetos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <Card className="items-center justify-center gap-2 p-12 text-center">
          <p className="text-sm font-medium">Carregando projetos...</p>
          <p className="text-xs text-muted-foreground">Buscando os projetos da sua conta.</p>
        </Card>
      ) : filtered.length === 0 && filteredShared.length === 0 ? (
        <Card className="items-center justify-center gap-2 p-12 text-center">
          <p className="text-sm font-medium">Nenhum projeto encontrado</p>
          <p className="text-xs text-muted-foreground">Tente ajustar sua busca.</p>
        </Card>
      ) : (
        <>
          {filtered.length > 0 && (
            <section className="flex flex-col gap-4 mt-4 mb-24">
              <h2 className="text-sm font-medium">Meus projetos</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => {
                  const totalSeconds = Number(p.duration ?? p.tracks.reduce((sum, track) => sum + Number(track.duration || 0), 0))
                  const totalMin = Math.round(totalSeconds / 60)
                  return (
                    <Link key={p.id} href={`/projects/${p.id}`}>
                      <Card className="group h-full gap-0 p-5 transition-colors hover:border-foreground/20">
                        <div className="flex items-start justify-between">
                          <span className="size-9 rounded-md" style={{ backgroundColor: p.color }} aria-hidden />
                          <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <h3 className="mt-4 font-medium">{p.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                        <div className="mt-5 flex items-center gap-4 border-t border-border pt-4 font-mono text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5"><Music className="size-3.5" />{p.tracks.length}</span>
                          <span>{totalMin} min</span>
                          <span className="ml-auto">{formatDate(p.updateAt)}</span>
                        </div>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            </section>
          )}

          {filteredShared.length > 0 && (
            <section className="flex flex-col gap-4 mt-4">
              <h2 className="text-sm font-medium">Projetos compartilhados</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredShared.map((project) => (
                  <Card key={project.token} className="group gap-0 p-5 transition-colors hover:border-foreground/20">
                    <div className="flex items-start justify-between">
                      <Link href={`/share/${project.token}`} className="size-9 rounded-md bg-muted" aria-label={`Abrir ${project.name}`} />
                      <div className="flex items-center gap-2">
                        <span className="w-fit rounded-full border border-border bg-muted/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {permissionLabels[project.permission]}
                        </span>
                        <button
                          type="button"
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          onClick={() => deleteSharedProject(project)}
                          disabled={deletingToken === project.token}
                          aria-label={`Remover link de ${project.name}`}
                          title="Desativar link"
                        >
                          <Trash2 className="size-4 cursor-pointer" />
                        </button>
                      </div>
                    </div>
                    <Link href={`/share/${project.token}`}>
                      <h3 className="mt-4 font-medium">{project.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Acesso por link compartilhado</p>
                      <div className="mt-5 border-t border-border pt-4 font-mono text-xs text-muted-foreground">
                        {project.expiresAt ? `Expira em ${formatDate(project.expiresAt)}` : 'Sem expiração'}
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
