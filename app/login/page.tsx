'use client'

import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { authWebhook } from '@/hooks/api/Auth.webhook'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(email: string, password: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authWebhook.login(email, password)
      if (response.userId) {
        window.localStorage.setItem("userId", response.userId)
      }

      const redirect = new URLSearchParams(window.location.search).get('redirect')
      const destination = redirect?.startsWith('/') && !redirect.startsWith('//')
        ? redirect
        : '/dashboard'
      router.push(destination)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Tente novamente mais tarde.')
      toast.error('Falha no Login', {
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8 lg:hidden">
        <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground font-mono text-sm font-bold">
          .a
        </span>
      </div>

      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Entrar</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance">
        Bem-vindo de volta
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Acesse sua conta para gerenciar seus projetos.
      </p>

      <form onSubmit={(e) => handleSubmit(email, password, e)} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="voce@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
              Esqueceu a senha?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={passwordVisible ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => {
                setPasswordVisible((prev) => !prev)
              }}
            >
              {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error ? (
          <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
          {!loading && <ArrowRight className="size-4" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}
