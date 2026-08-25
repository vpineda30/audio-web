'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { planLimits } from '@/lib/data'
import { userWebhook } from '@/hooks/api/User.webhook'

type SettingsUser = {
  id: string
  name: string
  email: string
  role: string
  plan: 'Free' | 'Pro'
  initials: string
  storageUsed: number
}

export function SettingsView() {
  const router = useRouter()
  const [user, setUser] = useState<SettingsUser | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loadingUser, setLoadingUser] = useState(true)
  const [emailNotif, setEmailNotif] = useState(true)
  const [productNotif, setProductNotif] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const planKey = user?.plan === 'Pro' ? 'PRO' : 'FREE'
  const limit = planLimits[planKey] 

  useEffect(() => {
    let active = true
    setLoadingUser(true)

    async function loadUser() {
      const userId = window.localStorage.getItem('userId')
      if (!userId) {
        if (active) setLoadingUser(false)
        return
      }

      try {
        const response = await userWebhook.findById(userId)

        if (!active) return

        const name = String(response.user.name ?? 'Usuário')
        const email = String(response.user.email ?? '')
        const role = String(response.user.role ?? 'USER')
        const rawPlan = response.user.subscriptionPlan
          ? String(response.user.subscriptionPlan)
          : ''
        const plan: 'Free' | 'Pro' = rawPlan.trim().toLowerCase().includes('pro') ? 'Pro' : 'Free'
        const initials = name
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
          .toUpperCase() || 'U'

        setUser({
          id: userId,
          name,
          email,
          role,
          plan,
          initials,
          storageUsed: Number(response.user.storageUsed ?? 0),
        })
        setName(name)
        setEmail(email)
      } catch (error) {
      } finally {
        if (active) setLoadingUser(false)
      }
    }

    loadUser()

    return () => {
      active = false
    }
  }, [])

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await userWebhook.update(user.id, { name, email, })
      setUser({ ...user, name, email })
      window.location.reload()
      toast.success('Perfil atualizado com sucesso')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar perfil'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const usedStorageMB = (user?.storageUsed ?? 0) / 1_000_000
  const storageValue = user?.plan === 'Pro'
    ? Number((usedStorageMB / 1024).toFixed(2))
    : Number(usedStorageMB.toFixed(2))

  async function handleDelete() {
    if (!user || deleting) return
    const confirmed = window.confirm('Tem certeza que deseja excluir sua conta? Esta ação é irreversível.')
    if (!confirmed) return

    const userId = window.localStorage.getItem('userId')

    if (!userId) {
      toast.error('Usuário não encontrado');
      return;
    }

    setDeleting(true)
    try {
      await userWebhook.delete(userId)

      window.localStorage.removeItem('userId')

      toast.success('Conta excluída com sucesso')
      router.push('/')
    } catch (error) {
      toast.error('Erro ao excluir conta')
    } finally {
      setDeleting(false)
    }
  }

  return (
    loadingUser ? (
      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </Card>
      </div>
    ) : (
      <div className="flex flex-col gap-6">
        {/* Perfil */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-lg font-medium">
              {user?.initials}
            </span>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-medium text-muted-foreground">{user?.role}</p>
            </div>
          </div>

          <Separator className="my-4" />

          <form className="flex flex-col gap-4" onSubmit={handleSave}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-name">Nome</Label>
                <Input
                  id="s-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-email">E-mail</Label>
                <Input
                  id="s-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
            </div>
            <div>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </Card>

        {/* Plano e uso */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">Plano e uso</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Você está no plano <Badge variant="secondary">{user?.plan}</Badge>
              </p>
            </div>
            <Button nativeButton={false} render={<Link href="/plans" />} variant="outline" size="sm">
              Gerenciar plano
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-4 font-mono text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Armazenamento</p>
              <p className="mt-1">
                {storageValue} / {limit.storageSize} {user?.plan === 'Pro' ? 'GB' : 'MB'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Projetos</p>
              <p className="mt-1">{limit.projects === Infinity ? 'Ilimitado' : `até ${limit.projects}`}</p>
            </div>
          </div>
        </Card>

        {/* Notificações */}
        <Card className="p-6">
          <h2 className="text-sm font-medium">Notificações</h2>

          <Separator className="my-4" />

          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">E-mails da conta</p>
                <p className="text-sm text-muted-foreground">Atualizações de segurança e faturamento.</p>
              </div>
              <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Novidades do produto</p>
                <p className="text-sm text-muted-foreground">Recursos e dicas ocasionais.</p>
              </div>
              <Switch checked={productNotif} onCheckedChange={setProductNotif} />
            </div>
          </div>
        </Card>

        {/* Zona de perigo */}
        <Card className="border-destructive/30 p-6 mb-20 border">
          <h2 className="text-sm font-medium text-destructive">Zona de perigo</h2>

          <Separator className="my-4" />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Excluir conta</p>
              <p className="text-sm text-muted-foreground">
                Remove permanentemente sua conta e todos os projetos.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Excluindo...' : 'Excluir conta'}
            </Button>
          </div>
        </Card>
      </div>)
  )
}
