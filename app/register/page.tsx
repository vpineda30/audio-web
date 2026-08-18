'use client'

import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { userWebhook } from '@/hooks/api/User.webhook'
import { authWebhook } from '@/hooks/api/Auth.webhook'
import { toast } from 'sonner'
import { Monogram } from '@/components/monogram'

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await userWebhook.create(username, email, password);
      setConfirmationSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao criar conta';
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="mb-8 lg:hidden">
        <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground font-mono text-sm font-bold">
          .a
        </span>
      </div>

      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Cadastro</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance">Criar sua conta</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Comece grátis. Sem cartão de crédito.
      </p>

      <form onSubmit={(e) => handleSubmit(e)} className="mt-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">Nome</Label>
          <Input id="username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Seu nome" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input id="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} type={passwordVisible ? 'text' : 'password'} placeholder="••••••••" required />
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

        {confirmationSent ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm text-primary-foreground">
            <p className="text-center text-sm text-muted-foreground text-blue-600">
              Enviamos uma confirmação para o seu e-mail. Verifique sua caixa de entrada.
            </p>
          </div>
        ) : (
          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
            {}
            {!loading && <ArrowRight className="size-4" />}
          </Button>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}
