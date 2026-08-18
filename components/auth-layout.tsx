import type { ReactNode } from 'react'
import { Monogram } from './monogram'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel de marca */}
      <div className="relative hidden flex-col justify-between border-r border-border bg-primary p-12 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2">
          <Monogram inverted />
        </div>

        <div className="max-w-md">
          <p className="font-mono text-xs uppercase tracking-widest text-primary-foreground/60">
            Plataforma para produtores
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-balance">
            Organize suas faixas e projetos de forma profissional.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">
            Armazene, gerencie e reproduza seus arquivos de áudio em um só lugar. Simples,
            escalável e feito para o seu fluxo de criação.
          </p>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs text-primary-foreground/50">
          <span>MP3 · WAV</span>
          <span>Free / Pro</span>
          <span>© 2026 .Audio</span>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
