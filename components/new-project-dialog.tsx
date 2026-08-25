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

export function NewProjectDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()

    if (creating) return

    const trimmedName = name.trim()

    if (!trimmedName) return

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

      toast.success('Projeto criado', {
        description: `"${trimmedName}" foi adicionado à sua conta.`,
      })

      setName('')
      setDescription('')
      setOpen(false)

      try {
        const all = await projectWebhook.findAll()
        const created = all.find((p) => p.name === trimmedName)

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
    <Dialog open={open} onOpenChange={setOpen}>
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
