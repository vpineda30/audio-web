'use client'

import { ArrowRight, Eye, EyeOff, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { authWebhook } from '@/hooks/api/Auth.webhook'
import { emailWebhook } from '@/hooks/api/Email.webhook'
import { Monogram } from '@/components/monogram'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendingVerification, setResendingVerification] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [sendingResetLink, setSendingResetLink] = useState(false)

  async function handleSubmit(email: string, password: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authWebhook.login(email, password)
      if (response.userId) {
        window.localStorage.setItem('userId', response.userId)
      }

      const redirect = new URLSearchParams(window.location.search).get('redirect')
      const destination = redirect?.startsWith('/') && !redirect.startsWith('//')
        ? redirect
        : '/dashboard'
      router.push(destination)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Tente novamente mais tarde.'
      setError(message)
      toast.error('Falha no Login', {
        description: message,
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    if (!email.trim()) return

    setResendingVerification(true)
    try {
      const response = await emailWebhook.resendVerification(email)
      toast.success('E-mail reenviado', { description: response.message })
    } catch (error) {
      toast.error('Não foi possível reenviar o e-mail', {
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
      })
    } finally {
      setResendingVerification(false)
    }
  }

  async function handleForgotPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!forgotEmail.trim()) {
      toast.error('Informe seu e-mail para recuperar a senha.')
      return
    }

    setSendingResetLink(true)
    try {
      const response = await emailWebhook.forgotPassword(forgotEmail.trim())
      toast.success('Solicitação enviada', {
        description: response.message,
      })
      setForgotMode(false)
      setForgotEmail('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível enviar o e-mail.'
      toast.error('Falha ao recuperar a senha', {
        description: message,
      })
    } finally {
      setSendingResetLink(false)
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8 lg:hidden">
        <Monogram />
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
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setForgotMode((prev) => !prev)}
            >
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
          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-3 text-sm text-destructive">
            <p>{error}</p>
            {error.toLowerCase().includes('confirme seu email') ? (
              <Button
                type="button"
                variant="outline"
                className="mt-3 w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleResendVerification}
                disabled={resendingVerification}
              >
                <MailCheck className="size-4" />
                {resendingVerification ? 'Reenviando...' : 'Reenviar e-mail de verificação'}
              </Button>
            ) : null}
          </div>
        ) : null}

        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
          {!loading && <ArrowRight className="size-4" />}
        </Button>
      </form>

      {forgotMode ? (
        <form onSubmit={handleForgotPassword} className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="forgot-email" className="text-sm font-medium">Recuperar acesso</Label>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setForgotMode(false)}
            >
              Fechar
            </button>
          </div>
          <Input
            id="forgot-email"
            type="email"
            placeholder="seu@email.com"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
          />
          <Button type="submit" variant="outline" className="w-full" disabled={sendingResetLink}>
            {sendingResetLink ? 'Enviando...' : 'Enviar link de recuperação'}
          </Button>
        </form>
      ) : null}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  )
}
