'use client'

import { cn } from '@/lib/utils'
import { ArrowUpRight, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'

type Option = { value: string; label: string; hint: string }

const profiles: Option[] = [
  { value: 'beatmaker', label: 'Beatmaker', hint: 'Produzo beats e instrumentais' },
  { value: 'produtor', label: 'Produtor', hint: 'Mixo e finalizo faixas' },
  { value: 'artista', label: 'Artista', hint: 'Gravo e lanço minhas músicas' },
  { value: 'estudio', label: 'Estúdio', hint: 'Gerencio vários clientes' },
]

const volumes: Option[] = [
  { value: 'poucos', label: 'Até 5', hint: 'Estou começando agora' },
  { value: 'medio', label: '6 a 20', hint: 'Já tenho um catálogo' },
  { value: 'muitos', label: 'Mais de 20', hint: 'Trabalho em alto volume' },
]

const formats: Option[] = [
  { value: 'mp3', label: 'MP3', hint: 'Leve, para prévias e demos' },
  { value: 'wav', label: 'WAV', hint: 'Alta qualidade, sem perdas' },
  { value: 'ambos', label: 'MP3 e WAV', hint: 'Uso os dois no fluxo' },
]

type Answers = { profile?: string; volume?: string; format?: string }

const steps = [
  { key: 'profile', title: 'O que descreve melhor você?', options: profiles },
  { key: 'volume', title: 'Quantos projetos você mantém ativos?', options: volumes },
  { key: 'format', title: 'Qual formato você mais usa?', options: formats },
] as const

export function OnboardingFlow() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [finished, setFinished] = useState(false)

  const totalSteps = steps.length

  const recommendation = useMemo(() => {
    const heavy = answers.volume === 'muitos' || answers.format === 'wav' || answers.format === 'ambos'
    const plan = heavy ? 'Pro' : 'Free'
    const profileLabel = profiles.find((p) => p.value === answers.profile)?.label ?? 'Criador'
    return {
      plan,
      description:
        plan === 'Pro'
          ? `Como ${profileLabel.toLowerCase()} que trabalha com volume e arquivos WAV, você aproveita projetos ilimitados e 10 GB de armazenamento.`
          : `Como ${profileLabel.toLowerCase()} começando agora, o plano gratuito já organiza até 5 projetos com player integrado — sem cartão.`,
      perks:
        plan === 'Pro'
          ? ['Projetos ilimitados', '10 GB de espaço', 'Suporte prioritário', 'Player integrado']
          : ['Até 5 projetos', '500 MB de espaço', 'Upload MP3 e WAV', 'Player integrado'],
    }
  }, [answers])

  function select(value: string) {
    const key = steps[step].key
    setAnswers((a) => ({ ...a, [key]: value }))
    window.setTimeout(() => {
      if (step < totalSteps - 1) setStep((s) => s + 1)
      else setFinished(true)
    }, 240)
  }

  function reset() {
    setAnswers({})
    setStep(0)
    setFinished(false)
  }

  const current = steps[step]
  const currentValue = answers[current.key as keyof Answers]

  return (
    <div className="border border-border">
      {/* progress header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4 font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        <span>{finished ? 'Tudo pronto' : current.title}</span>
        <span className="tabular-nums text-foreground">
          {finished ? '03' : String(step + 1).padStart(2, '0')} / 0{totalSteps}
        </span>
      </div>

      {!finished ? (
        <div key={current.key} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ul>
            {current.options.map((opt, i) => {
              const active = currentValue === opt.value
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => select(opt.value)}
                    className={cn(
                      'group flex w-full items-center cursor-pointer gap-5 border-b border-border px-5 py-5 text-left transition-colors last:border-b-0',
                      active ? 'bg-accent' : 'hover:bg-accent/50',
                    )}
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
                      <span className="font-display text-3xl uppercase leading-none tracking-tight transition-transform duration-300 group-hover:translate-x-1 sm:text-4xl">
                        {opt.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{opt.hint}</span>
                    </span>
                    <ArrowUpRight className="size-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </li>
              )
            })}
          </ul>

          {step > 0 ? (
            <div className="px-5 py-4">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
              >
                ← Voltar
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-300 p-5 sm:p-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            Recomendação
          </p>
          <p className="mt-4 font-display text-4xl uppercase leading-none tracking-tight sm:text-6xl">
            Plano {recommendation.plan}
          </p>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {recommendation.description}
          </p>

          <ul className="mt-6 flex flex-col divide-y divide-border border-y border-border">
            {recommendation.perks.map((perk) => (
              <li
                key={perk}
                className="flex items-center justify-between py-3 font-sans text-xs uppercase tracking-wider"
              >
                <span>{perk}</span>
                <span className="text-muted-foreground">+</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/register?plan=${recommendation.plan.toLowerCase()}`}
              className="group inline-flex flex-1 items-center justify-between gap-3 bg-primary px-5 py-4 font-mono text-xs uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
            >
              Criar minha conta {recommendation.plan}
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 border border-foreground/40 px-5 py-4 font-mono text-xs uppercase tracking-[0.2em] transition-colors hover:bg-accent"
            >
              <RotateCcw className="size-4" />
              Refazer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
