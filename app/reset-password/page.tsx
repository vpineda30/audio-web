'use client'

import { ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { emailWebhook } from '@/hooks/api/Email.webhook'

function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [passwordVisible, setPasswordVisible] = useState(false)
    const [confirmVisible, setConfirmVisible] = useState(false)
    const [status, setStatus] = useState<'ready' | 'success' | 'error'>('ready')
    const [message, setMessage] = useState('')

    const token = searchParams.get('token') ?? ''

    useEffect(() => {
        if (!token) {
            setStatus('error')
            setMessage('Token de redefinição ausente ou inválido.')
        }
    }, [token])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!token) {
            setStatus('error')
            setMessage('Token de redefinição ausente ou inválido.')
            return
        }

        if (password.length < 8) {
            toast.error('A senha precisa ter no mínimo 8 caracteres.')
            return
        }

        if (password !== confirmPassword) {
            toast.error('As senhas precisam ser iguais.')
            return
        }

        setLoading(true)

        try {
            const response = await emailWebhook.resetPassword(token, password)
            setStatus('success')
            setMessage(response.message || 'Senha redefinida com sucesso!')
            toast.success('Senha redefinida', {
                description: 'Você já pode entrar com sua nova senha.',
            })

            setTimeout(() => router.push('/login'), 1800)
        } catch (error) {
            const text = error instanceof Error ? error.message : 'Não foi possível redefinir a senha.'
            setStatus('error')
            setMessage(text)
            toast.error('Falha ao redefinir senha', {
                description: text,
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <AuthLayout>
            <div className="space-y-0">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Recuperar senha</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-balance">
                    {status === 'success' ? 'Senha atualizada' : 'Redefinir senha'}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    {status === 'success'
                        ? 'Sua senha foi redefinida com sucesso.'
                        : 'Crie uma nova senha para continuar.'}
                </p>

                {status === 'error' && message ? (
                    <p className="mt-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {message}
                    </p>
                ) : null}

                {status !== 'success' ? (
                    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="new-password">Nova senha</Label>
                            <div className="relative">
                                <Input
                                    id="new-password"
                                    type={passwordVisible ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={!token}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    onClick={() => setPasswordVisible((prev) => !prev)}
                                >
                                    {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="confirm-password">Confirmar senha</Label>
                            <div className="relative">
                                <Input
                                    id="confirm-password"
                                    type={confirmVisible ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={!token}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    onClick={() => setConfirmVisible((prev) => !prev)}
                                >
                                    {confirmVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="mt-2 w-full" disabled={loading || !token}>
                            {loading ? 'Atualizando...' : 'Atualizar senha'}
                            {!loading && <ArrowRight className="size-4" />}
                        </Button>
                    </form>
                ) : (
                    <div className="mt-8 flex flex-col items-center gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                        <ShieldCheck className="size-10 text-emerald-600" />
                        <p className="text-sm text-muted-foreground">{message}</p>
                        <Button onClick={() => router.push('/login')} className="w-full">
                            Voltar para o login
                        </Button>
                    </div>
                )}
            </div>
        </AuthLayout>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<AuthLayout><p className="text-sm text-muted-foreground">Carregando...</p></AuthLayout>}>
            <ResetPasswordContent />
        </Suspense>
    )
}
