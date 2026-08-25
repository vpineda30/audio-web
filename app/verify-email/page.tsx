'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/auth-layout'
import { Button } from '@/components/ui/button'
import { emailWebhook } from '@/hooks/api/Email.webhook'

function VerifyEmailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('Confirmando seu e-mail...')

    useEffect(() => {
        const token = searchParams.get('token')

        if (!token) {
            setStatus('error')
            setMessage('Token de verificação ausente.')
            return
        }

        const verificationToken = token

        async function verify() {
            try {
                const response = await emailWebhook.verifyEmail(verificationToken)
                setStatus('success')
                setMessage(response.message || 'E-mail confirmado com sucesso!')
                toast.success('E-mail confirmado', {
                    description: 'Você já pode fazer login na sua conta.',
                })

                setTimeout(() => router.push('/login'), 1800)
            } catch (error) {
                const text = error instanceof Error ? error.message : 'Não foi possível confirmar seu e-mail.'
                setStatus('error')
                setMessage(text)
                toast.error('Falha na verificação', {
                    description: text,
                })
            }
        }

        verify()
    }, [router, searchParams])

    return (
        <AuthLayout>
            <div className="flex flex-col gap-4 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Confirmação</p>
                <h2 className="text-2xl font-semibold tracking-tight">
                    {status === 'success' ? 'Tudo certo!' : status === 'error' ? 'Não foi possível confirmar' : 'Confirmando seu e-mail'}
                </h2>
                <p className="text-sm text-muted-foreground">{message}</p>

                {status !== 'loading' && (
                    <Button onClick={() => router.push('/login')} className="mt-2 w-full">
                        Ir para o login
                    </Button>
                )}
            </div>
        </AuthLayout>
    )
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<AuthLayout><p className="text-sm text-muted-foreground">Carregando...</p></AuthLayout>}>
            <VerifyEmailContent />
        </Suspense>
    )
}
