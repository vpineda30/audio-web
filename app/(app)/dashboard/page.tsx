'use client'

import { ArrowUpRight, FolderOpen, HardDrive, Music, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/page-header'
import { allTracks, formatDate, formatTime, planLimits, Project, totalTracks, usedStorageGB, User } from '@/lib/data'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { userWebhook } from '@/hooks/api/User.webhook'
import { projectWebhook } from '@/hooks/api/Projects.webhook'
import { useRouter } from 'next/navigation'

interface dashboardData {
  user: User
  projects: Project[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [dashboard, setDashboard] = useState<dashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      let activeUser: User | null = null;

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/login");
          return;
        }

        const userId = localStorage.getItem("userId");

        if (!userId) {
          router.replace("/login");
          return;
        }

        const [userResponse, projects] = await Promise.all([
          userWebhook.findById(userId),
          projectWebhook.findAll(token, userId),
        ]);

        setDashboard({
          user: userResponse.user,
          projects,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  const plan = dashboard?.user.subscriptionPlan === "PRO" ? "PRO" : "FREE";
  const limit = planLimits[plan];
  const storagePct = Math.min(100, Math.round((usedStorageGB / (limit?.storageSize || 1)) * 100))
  const recentTracks = [...allTracks]
    .sort((a, b) => +new Date(b.addedAt) - +new Date(a.addedAt))
    .slice(0, 5)

  const stats = [
    {
      label: 'Projetos',
      value: `${dashboard?.projects.length ?? '0'}`,
      hint: limit.projects === Infinity ? 'Ilimitado' : `de ${limit.projects}`,
      icon: FolderOpen,
    },
    { label: 'Faixas', value: `${totalTracks}`, hint: 'no total', icon: Music },
    {
      label: 'Armazenamento',
      value: `${usedStorageGB} ${dashboard?.user.subscriptionPlan === "PRO" ? "GB" : "MB"}`,
      hint: `de ${limit.storageSize} ${dashboard?.user.subscriptionPlan === "PRO" ? "GB" : "MB"}`,
      icon: HardDrive,
    },
    { label: 'Plano', value: plan, hint: 'atual', icon: Sparkles },
  ]

  return (
    loading ? (
      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Carregando dados...</p>
        </Card>
      </div>
    ) : (
      <motion.div className="flex flex-col gap-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <PageHeader
          eyebrow="Visão geral"
          title={`Olá, ${dashboard?.user ? dashboard.user.name?.split(' ')[0] : 'Carregando...'}`}
          description="Acompanhe o uso da sua conta e acesse rapidamente seus projetos."
          action={
            <Button nativeButton={false} render={<Link href="/projects" />}>
              Ver projetos
              <ArrowUpRight className="size-4" />
            </Button>
          }
        />

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="gap-0 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </span>
                <s.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight">{s.value}</span>
                <span className="text-xs text-muted-foreground">{s.hint}</span>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Armazenamento */}
          <Card className="p-6 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Armazenamento</h2>
              <Badge variant="outline" className="font-mono text-xs">
                {storagePct}%
              </Badge>
            </div>
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tracking-tight">{usedStorageGB}</span>
              <span className="text-sm text-muted-foreground">/ {limit.storageSize} {dashboard?.user.subscriptionPlan === "PRO" ? "GB" : "MB"}</span>
            </div>
            <Progress value={storagePct} className="mt-4" />
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {dashboard?.user.subscriptionPlan !== 'PRO'
                ? 'Você está no plano Free. Faça upgrade para o Pro e amplie seu espaço.'
                : 'Você tem espaço de sobra no plano Pro.'}
            </p>
            {dashboard?.user ? dashboard.user.subscriptionPlan === 'FREE' && (
              <Button
                nativeButton={false}
                render={<Link href="/plans" />}
                variant="outline"
                size="sm"
                className="mt-2 py-5 w-full"
              >
                Fazer upgrade
              </Button>
            ) : 'Carregando...'}
          </Card>

          {/* Faixas recentes */}
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Faixas recentes</h2>
              <Link
                href="/projects"
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Ver tudo
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {recentTracks ? recentTracks.map((t) => (
                <li key={t.id} className="flex items-center gap-4 py-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-muted">
                    <Music className="size-4 text-muted-foreground" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.projectName}</p>
                  </div>
                  <Badge variant="secondary" className="hidden font-mono text-[10px] uppercase sm:inline-flex">
                    {t.format}
                  </Badge>
                  <span className="w-12 text-right font-mono text-xs text-muted-foreground">
                    {formatTime(t.duration)}
                  </span>
                </li>
               )) : (<p className="text-sm text-muted-foreground">Sem tracks recentes</p>)}
            </ul>
          </Card>
        </div>

        {/* Projetos recentes */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-medium">Projetos atualizados recentemente</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...(dashboard?.projects ?? [])]
              .sort((a, b) => +new Date(b.updateAt) - +new Date(a.createAt))
              .slice(0, 3)
              .map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`}>
                  <Card className="group h-full gap-0 p-5 transition-colors hover:border-foreground/20">
                    <div className="flex items-start justify-between">
                      <span
                        className="size-8 rounded-md"
                        style={{ backgroundColor: p.color || '#EF4444' }}
                        aria-hidden
                      />
                      <ArrowUpRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>

                    <h3 className="mt-4 font-medium">{p.name}</h3>

                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {p.description || "Sem Descrição"}
                    </p>

                    <div className="mt-4 flex items-center gap-3 font-mono text-xs text-muted-foreground">
                      <span>{p.tracks?.length ?? 0} faixas</span>
                      <span>·</span>
                      <span>{formatDate(p.updateAt)}</span>
                    </div>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </motion.div>)
  )
}
