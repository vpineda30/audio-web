'use client'

import { Check, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { subscriptionWebhook } from '@/hooks/api/Subscription.webhook'
import { userWebhook } from '@/hooks/api/User.webhook'
import { User } from '@/lib/data'

const plans: ReadonlyArray<{
  id: 'Free' | 'Pro'
  price: string
  period: string
  description: string
  features: readonly string[]
  highlight?: boolean
}> = [
    {
      id: 'Free',
      price: 'R$ 0',
      period: '/mês',
      description: 'Para começar a organizar seus primeiros projetos.',
      features: ['Até 5 projetos', '500 MB de armazenamento', 'Upload de MP3 e WAV', 'Player de áudio integrado'],
    },
    {
      id: 'Pro',
      price: 'R$ 29',
      period: '/mês',
      description: 'Para produtores que precisam de espaço e escala.',
      features: [
        'Projetos ilimitados',
        '10 GB de armazenamento',
        'Upload de MP3 e WAV',
        'Player de áudio integrado',
        'Suporte prioritário',
      ],
      highlight: true,
    },
  ]

type CheckoutResponse = {
  url: string;
};

export function PlansView() {
  const [currentPlan, setCurrentPlan] = useState<'FREE' | 'PRO' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckoutInProgress, setIsCheckoutInProgress] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<'FREE' | 'PRO' | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkoutStatus = params.get('checkout')

    if (checkoutStatus === 'success' || checkoutStatus === 'cancel') {
      setIsCheckoutInProgress(false)
      setPendingPlan(null)
      loadUserPlan({ skipPending: true })
      return
    }

    loadUserPlan()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkoutStatus = params.get('checkout')

    if (checkoutStatus === 'success' || checkoutStatus === 'cancel') {
      setIsCheckoutInProgress(false)
      setPendingPlan(null)
      loadUserPlan({ skipPending: true })
      return
    }

    loadUserPlan()
  }, [])

  async function createCheckout(selectedPlan: 'Free' | 'Pro') {
    const normalizedPlan = selectedPlan.toUpperCase() as 'FREE' | 'PRO'

    if (normalizedPlan === currentPlan) {
      toast.error('Este é seu plano atual', {
        description: 'Você já possui este plano.',
      })
      return
    }

    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')

    if (!userId || !token) {
      toast.error('Usuário não identificado', {
        description: 'Por favor, faça login novamente.',
      })
      return
    }

    try {
      setIsCheckoutInProgress(true)
      setPendingPlan(normalizedPlan)
      setIsLoading(true)

      const response = await subscriptionWebhook.createCheckoutSession(
        token,
        userId,
        normalizedPlan,
      ) as CheckoutResponse

      if (response?.url) {
        window.location.href = response.url
      }

    } catch (error) {
      toast.error('Não foi possível iniciar o checkout', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setIsLoading(false)
      setIsCheckoutInProgress(false)
    }
  }

  async function cancelSubscription() {
  const userId = localStorage.getItem('userId')
  const token = localStorage.getItem('token')

  if (!userId || !token) {
    toast.error('Usuário não identificado', {
      description: 'Por favor, faça login novamente.',
    })
    return
  }

  try {
    setIsLoading(true)

    const response = await subscriptionWebhook.cancelSubscription(
      token,
      userId,
    )

    toast.success('Assinatura cancelada', {
      description: response?.message || 'Cancelamento agendado com sucesso.',
    })

  } catch (error) {
    toast.error('Não foi possível cancelar a assinatura', {
      description: error instanceof Error ? error.message : 'Erro desconhecido',
    })
  } finally {
    setIsLoading(false)
  }
}

  async function loadUserPlan({
    skipPending = false,
  }: {
    skipPending?: boolean
  } = {}) {
    const userId = localStorage.getItem('userId')
    const token = localStorage.getItem('token')

    if (!userId || !token) {
      toast.error('Usuário não identificado', {
        description: 'Por favor, faça login novamente.',
      })
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      const response = await userWebhook.findById(userId)
      const plan =
        response.user.subscriptionPlan?.toUpperCase() === 'PRO'
          ? 'PRO'
          : 'FREE'

      if (!skipPending && pendingPlan && pendingPlan !== plan) {
        toast.success('Plano atualizado!', {
          description: `Seu plano agora é ${plan}.`,
        })
      }

      setCurrentPlan(plan)
    } catch (error) {
      toast.error('Não foi possível carregar o plano do usuário', {
        description: error instanceof Error ? error.message : 'Erro desconhecido',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Planos Disponíveis */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => {
            const planIdUppercase = plan.id.toUpperCase() as 'FREE' | 'PRO'
            const isCurrent = currentPlan === planIdUppercase
            return (
              <Card
                key={plan.id}
                className={cn(
                  'gap-0 p-6',
                  plan.highlight && 'border-foreground/20 ring-1 ring-foreground/10',
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{plan.id}</h3>
                  {!isCurrent && plan.highlight && <Badge>Recomendado</Badge>}
                  {isCurrent && <Badge variant="secondary">Seu plano</Badge>}
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

                <ul className="mt-6 flex flex-col gap-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted">
                        <Check className="size-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent && plan.id === 'Pro' && (
                  <Button
                    variant="destructive"
                    className="mt-6 py-5 w-full text-sm font-medium cursor-pointer"
                    onClick={() => cancelSubscription()}
                  >
                    Cancelar assinatura
                  </Button>
                )}

                {isCurrent && plan.id !== 'Pro' && (
                  <Button
                    disabled
                    variant="outline"
                    className="mt-6 py-5 w-full border-2 text-sm font-medium opacity-60 cursor-not-allowed"
                  >
                    Plano Atual
                  </Button>
                )}

                {!isCurrent && plan.id === 'Pro' && (
                  <Button
                    className="mt-6 py-5 w-full border-2 border-transparent text-sm font-medium cursor-pointer"
                    onClick={() => createCheckout(plan.id)}
                  >
                    Assinar este plano
                  </Button>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
