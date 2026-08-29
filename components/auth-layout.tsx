'use client'

import type { ReactNode } from 'react'
import { Monogram } from './monogram'
import { useRouter } from 'next/navigation'

export function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Painel de marca */}
      <div className="relative hidden flex-col justify-between border-r border-border bg-primary p-12 text-primary-foreground lg:flex px-12">
        <div className="flex items-center gap-2">
          <Monogram inverted onClick={() => router.push('/')} />
        </div>

        <div className="max-w-md">
          <p className="font-mono text-xs uppercase tracking-widest text-primary-foreground/60">
            Plataforma para artistas e produtores musicais
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight text-balance">
            Organize suas faixas e projetos de forma profissional.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/70">
            Armazene, gerencie, reproduza e compartilhe suas faixas em um só lugar. Simples,
            escalável e feito para o seu fluxo de criação.
          </p>
        </div>

        <div className="flex items-center gap-6 font-mono text-xs text-primary-foreground/50">
          <span>© 2026 .Audio</span>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex min-h-dvh items-center justify-center overflow-y-auto px-6 py-10 sm:p-12">
        <div className="my-auto w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
