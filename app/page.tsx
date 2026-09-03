import { OnboardingFlow } from '@/components/landing/onboarding-flow'
import { Reveal } from '@/components/landing/reveal'
import { Waveform } from '@/components/landing/waveform'
import { ModeToggle } from '@/components/mode-toggle'
import { Monogram } from '@/components/monogram'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const index = [
  {
    n: '01',
    title: 'Projetos',
    desc: 'Agrupe faixas por álbum, EP ou cliente — cada com sua identidade própria.',
  },
  {
    n: '02',
    title: 'Upload WAV',
    desc: 'Prévias leves em MP3 ou masters sem perdas em WAV. Seus arquivos, sempre à mão.',
  },
  {
    n: '03',
    title: 'Versionamento',
    desc: 'Mantenha versões diferentes de cada faixa, com histórico de alterações e backups.',
  },
  {
    n: '04',
    title: 'Compartilhamento',
    desc: 'Compartilhe faixas e projetos com clientes, parceiros ou amigos, com links privados.',
  },
  {
    n: '05',
    title: 'Player',
    desc: 'Ouça qualquer faixa direto na plataforma, com controle de tempo e volume.',
  },
  {
    n: '06',
    title: 'Metadados',
    desc: 'BPM, tom, duração e tamanho sempre visíveis para acelerar o seu fluxo.',
  },
  {
    n: '07',
    title: 'Segurança',
    desc: 'Segurança de dados, faixas e projetos com criptografia de ponta a ponta.',
  }
]

const plans = [
  {
    id: 'Free',
    price: 'R$ 0',
    note: 'Para começar a organizar.',
    perks: ['Até 5 projetos', '500 MB de espaço', 'Upload MP3 e WAV', 'Player integrado', 'Compartilhamento de projetos'],
    cta: 'Começar grátis',
    highlight: false,
  },
  {
    id: 'Pro',
    price: 'R$ 29',
    note: 'Para escalar sua produção.',
    perks: [
      'Projetos ilimitados',
      '10 GB de espaço',
      'Links de compartilhamento com permissão de edição',
      'Predefinições de metadados por projeto',
      'Suporte prioritário',
      'Player integrado',
    ],
    cta: 'Assinar o Pro',
    highlight: true,
  },
]

export default function LandingPage() {
  return (
    <div className="landing relative min-h-screen overflow-x-hidden bg-background font-sans text-foreground">
      {/* Fixed top nav */}
      <header className="fixed inset-x-0 top-0 z-50 bg-background/70 backdrop-blur-md">
        <div className="grid grid-cols-2 items-center px-4 py-4 sm:px-6 md:grid-cols-3">
          <nav className="hidden items-center gap-6 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground md:flex">
            <a href="#indice" className="transition-colors hover:text-foreground">
              Recursos
            </a>
            <a href="#planos" className="transition-colors hover:text-foreground">
              Planos
            </a>
            <a href="#comecar" className="transition-colors hover:text-foreground">
              Começar
            </a>
          </nav>

          <Link href="/" className="flex items-center gap-2 md:justify-center" aria-label=".Audio">
            <Monogram />
          </Link>

          <div className="flex items-center justify-end gap-5 font-mono text-[11px] uppercase tracking-[0.2em]">
            <ModeToggle />
            <Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">
              Entrar
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-foreground transition-opacity hover:opacity-70"
            >
              Criar conta
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative pb-20 pt-28 sm:pt-32">
        {/* Hero */}
        <section className="flex min-h-[92vh] flex-col justify-center px-4 sm:px-6 pb-28 sm:pb-32">
          <Reveal>
            <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
              Plataforma para artistas e produtores musicais
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 font-display text-[16vw] uppercase leading-[0.82] tracking-tight text-balance sm:text-[13vw] lg:text-[11vw]">
              Sua Arte
              <br />
              merece mais
              <br />
              que uma{' '}
              <span className="text-muted-foreground">pasta.</span>
            </h1>
          </Reveal>

          <div className="mt-10 flex flex-col gap-8 border-t border-border pt-14 md:flex-row md:items-end md:justify-between">
            <Reveal delay={160}>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Armazene, organize, reproduza e compartilhe todas as suas músicas em um só lugar. Feito
                para o fluxo de quem leva o som a sério.
              </p>
            </Reveal>

            <Reveal delay={220}>
              <Link
                href="#comecar"
                className="group inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-foreground"
              >
                <span className="border-b border-foreground pb-1 transition-colors group-hover:border-muted-foreground group-hover:text-muted-foreground">
                  Começar em 30 segundos
                </span>
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            </Reveal>
          </div>

          <Reveal delay={280} className="mt-12">
            <div className="h-20 w-full text-foreground/50">
              <Waveform bars={96} />
            </div>
          </Reveal>
        </section>

        {/* Manifesto */}
        <section className="px-4 py-28 sm:px-6 sm:py-40">
          <Reveal>
            <p className="mx-auto max-w-5xl text-center font-display text-[8vw] uppercase leading-[0.95] tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Você <span className="text-muted-foreground">cria.</span> A gente organiza, armazena e{' '}
              <span className="text-muted-foreground">toca.</span>
            </p>
          </Reveal>
        </section>

        {/* Marquee band */}
        <section className="space-y-4 overflow-hidden border-y border-border py-8">
          <div className="flex w-max animate-marquee items-center whitespace-nowrap font-display text-6xl uppercase tracking-tight sm:text-7xl">
            {Array.from({ length: 2 }).map((_, r) => (
              <span key={r} className="flex items-center">
                {['Organize', 'Armazene', 'Reproduza', 'Compartilhe'].map((w) => (
                  <span key={w} className="flex items-center">
                    <span className="px-6">{w}</span>
                    <span className="text-muted-foreground">/</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
          <div className="flex w-max animate-marquee-reverse items-center whitespace-nowrap font-display text-6xl uppercase tracking-tight text-muted-foreground sm:text-7xl">
            {Array.from({ length: 2 }).map((_, r) => (
              <span key={r} className="flex items-center">
                {['MP3', 'WAV', 'BPM & Tom', 'Player', 'Projetos ∞'].map((w) => (
                  <span key={w} className="flex items-center">
                    <span className="px-6">{w}</span>
                    <span className="text-foreground/30">•</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </section>

        {/* Índice / Recursos */}
        <section id="indice" className="px-4 sm:px-6 py-32 sm:py-54">
          <Reveal className="mb-10 flex items-end justify-between gap-4 border-b border-border pb-6">
            <h2 className="font-display text-4xl uppercase leading-none tracking-tight sm:text-6xl">
              O que Oferecemos
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Índice / 05
            </span>
          </Reveal>

          <ul>
            {index.map((item, i) => (
              <Reveal as="li" key={item.n} delay={i * 60}>
                <div className="group grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 border-b border-border py-7 transition-colors hover:bg-accent/40 sm:grid-cols-[5rem_minmax(0,1fr)_minmax(0,26rem)_auto] sm:py-8">
                  <span className="font-mono text-sm text-muted-foreground">{item.n}</span>
                  <h3 className="font-display text-4xl uppercase leading-none tracking-tight transition-transform duration-300 group-hover:translate-x-2 sm:text-6xl">
                    {item.title}
                  </h3>
                  <p className="col-start-2 max-w-md text-sm leading-relaxed text-muted-foreground sm:col-start-3">
                    {item.desc}
                  </p>
                  <ArrowUpRight className="col-start-2 size-6 text-muted-foreground opacity-0 transition-all duration-300 group-hover:opacity-100 sm:col-start-4 sm:justify-self-end" />
                </div>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* Split statement */}
        <section className="px-4 sm:px-6 py-24 sm:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <p className="font-display text-5xl uppercase leading-[0.9] tracking-tight text-balance sm:text-7xl">
                Sem planilhas.
                <br />
                Sem pastas soltas.
                <br />
                <span className="text-muted-foreground">Sem arquivos perdidos.</span>
              </p>
            </Reveal>

            <Reveal delay={140} y={40}>
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  <span>Sessões noturnas</span>
                  <span>12 faixas · WAV</span>
                </div>
                <div className="my-8 h-28 text-foreground">
                  <Waveform bars={64} />
                </div>
                <div className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary font-display text-lg text-primary-foreground">
                    ▶
                  </span>
                  <div className="flex-1">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full w-2/3 rounded-full bg-foreground" />
                    </div>
                    <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
                      <span>02:28</span>
                      <span>03:41</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Onboarding */}
        <section id="comecar" className="px-4 sm:px-6 py-24 sm:py-32">
          <Reveal className="mb-12 flex items-end justify-between gap-4 border-b border-border pb-6">
            <h2 className="font-display text-4xl uppercase leading-none tracking-tight sm:text-6xl">
              Monte seu
              <br />
              espaço
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              3 passos
            </span>
          </Reveal>

          <Reveal delay={120}>
            <OnboardingFlow />
          </Reveal>
        </section>

        {/* Planos */}
        <section id="planos" className="px-4 py-24 sm:px-6 sm:py-32">
          <Reveal className="mb-12 flex items-end justify-between gap-4 border-b border-border pb-6">
            <h2 className="font-display text-4xl uppercase leading-none tracking-tight sm:text-6xl">
              Planos
            </h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Comece de graça
            </span>
          </Reveal>

          <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
            {plans.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 100}>
                <div className="flex h-full flex-col bg-background p-8 sm:p-10">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-5xl uppercase tracking-tight sm:text-6xl">
                      {plan.id}
                    </h3>
                    {plan.highlight ? (
                      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        Recomendado
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="font-display text-4xl tracking-tight">{plan.price}</span>
                    <span className="font-mono text-xs text-muted-foreground">/mês</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.note}</p>

                  <ul className="mt-8 flex flex-1 flex-col divide-y divide-border border-y border-border">
                    {plan.perks.map((perk) => (
                      <li
                        key={perk}
                        className="flex items-center justify-between py-3 text-xs uppercase tracking-wider"
                      >
                        <span>{perk}</span>
                        <span className="text-muted-foreground">+</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/register?plan=${plan.id.toLowerCase()}`}
                    className={`group mt-8 inline-flex items-center justify-between gap-3 px-5 py-4 font-mono text-xs uppercase tracking-[0.2em] transition-colors ${
                      plan.highlight
                        ? 'bg-primary text-primary-foreground hover:opacity-90'
                        : 'border border-foreground/40 text-foreground hover:bg-accent'
                    }`}
                  >
                    {plan.cta}
                    <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="px-4 py-28 sm:px-6 sm:py-44">
          <Reveal className="text-center">
            <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
              Pronto?
            </span>
            <Link href="/register" className="group mt-6 block">
              <span className="block font-display text-[18vw] uppercase leading-[0.82] tracking-tight transition-colors group-hover:text-muted-foreground sm:text-[15vw] lg:text-[13vw]">
                Comece
                <br />
                agora
              </span>
              <span className="mt-8 inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Criar conta grátis
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </span>
            </Link>
          </Reveal>
        </section>
      </main>

      {/* Fixed bottom bar */}
      <footer className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/70 backdrop-blur-md">
        <div className="grid grid-cols-2 items-center gap-2 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground sm:px-6 md:grid-cols-3">
          <span className="hidden md:inline">Sua música, organizada</span>
          <span className="flex items-center gap-2 md:justify-center">
            <Monogram />
          </span>
          <span className="justify-self-end">© 2026 .Audio - São Paulo — BR</span>
        </div>
      </footer>
    </div>
  )
}
