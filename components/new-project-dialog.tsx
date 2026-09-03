'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { projectWebhook } from '@/hooks/api/Projects.webhook'
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
import { trackKeyOptions } from '@/lib/data'
import { userWebhook } from '@/hooks/api/User.webhook'

export function NewProjectDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [predefinedBpm, setPredefinedBpm] = useState('')
  const [predefinedKey, setPredefinedKey] = useState('')
  const [creating, setCreating] = useState(false)
  const [isPro, setIsPro] = useState(false)

  async function loadPlan() {
    try {
      const response = await userWebhook.me()
      setIsPro(String(response.user.subscriptionPlan ?? '').toUpperCase() === 'PRO')
    } catch {
      setIsPro(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()

    if (creating) return

    const trimmedName = name.trim()

    if (!trimmedName) return

    const bpm = predefinedBpm.trim() ? Number(predefinedBpm) : undefined

    if (bpm !== undefined && (!Number.isFinite(bpm) || bpm <= 0)) {
      toast.error('BPM deve ser um número válido')
      return
    }

    const userId = localStorage.getItem('userId')

    if (!userId) {
      toast.error('Usuário não autenticado', {
        description: 'Faça login novamente para criar um projeto.',
      })
      return
    }

    setCreating(true)

    try {
      await projectWebhook.create({
        name: trimmedName,
        description: description.trim() || undefined,
      })

      const all = await projectWebhook.findAll()
      const created = all.find((project) => project.name === trimmedName)

      if ((bpm !== undefined || predefinedKey) && !created?.id) {
        throw new Error('Não foi possível identificar o projeto criado para salvar a predefinição.')
      }

      if (created?.id && (bpm !== undefined || predefinedKey)) {
        await projectWebhook.setPredefinedMetadatas(created.id, {
          bpm,
          key: predefinedKey || undefined,
        })
      }

      toast.success('Projeto criado', {
        description: `"${trimmedName}" foi adicionado à sua conta.`,
      })

      setName('')
      setDescription('')
      setPredefinedBpm('')
      setPredefinedKey('')
      setOpen(false)

      try {
        router.push(
          created?.id
            ? `/projects/${created.id}`
            : `/projects/${encodeURIComponent(trimmedName)}`
        )
      } catch {
        router.push(`/projects/${encodeURIComponent(trimmedName)}`)
      }
    } catch (error) {
      toast.error('Não foi possível criar o projeto', {
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen)
      if (nextOpen) void loadPlan()
    }}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        Novo projeto
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo projeto</DialogTitle>
          <DialogDescription>
            Crie um projeto para organizar suas faixas relacionadas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {isPro && <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">Nome do projeto</Label>
            <Input
              id="project-name"
              placeholder="Ex: Meu novo EP"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-desc">Descrição (opcional)</Label>
            <Input
              id="project-desc"
              placeholder="Breve descrição do projeto"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <Label className='mb-4 mt-4' htmlFor="project-predefined-key">Predefinições de metadados (recurso Pro)</Label>
            <Label htmlFor="project-predefined-key">Tom predefinido</Label>
            <select
              id="project-predefined-key"
              value={predefinedKey}
              onChange={(e) => setPredefinedKey(e.target.value)}
              disabled={!isPro}
              className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent dark:bg-input/30 px-2.5 py-1 text-sm text-foreground transition-colors outline-none appearance-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-transparent disabled:opacity-50"
            >
              <option value="">Sem tom predefinido</option>
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
          <div className="flex flex-col gap-2">
            <Label className='mb-2' htmlFor="project-predefined-bpm">BPM predefinido</Label>
            <Input
              id="project-predefined-bpm"
              type="number"
              min="1"
              placeholder="Ex: 120"
              value={predefinedBpm}
              onChange={(e) => setPredefinedBpm(e.target.value)}
              disabled={!isPro}
            />
          </div>
          </>}
          <DialogFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={creating}>
              {creating ? 'Criando...' : 'Criar projeto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
