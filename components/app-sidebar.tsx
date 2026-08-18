'use client'

import { FolderOpen, LayoutDashboard, LogOut, Settings, Sparkles, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { userWebhook } from '@/hooks/api/User.webhook'
import { Monogram } from './monogram'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projetos', icon: FolderOpen },
  { href: '/plans', label: 'Planos', icon: Sparkles },
  { href: '/settings', label: 'Configurações', icon: Settings },
]

type SidebarUser = {
  name: string
  email: string
  initials: string
}

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [userActive, setUserActive] = useState<SidebarUser | null>(null)

  useEffect(() => {
    let active = true

    async function loadUser() {
      const token = window.localStorage.getItem('token')
      const userId = window.localStorage.getItem('userId')

      if (!token || !userId) {
        if (active) setUserActive(null)
        return
      }

      try {
        const response = await userWebhook.findById(userId)
        const data = response.user as Record<string, unknown>

        if (!active) return

        const name = String(data.name ?? 'Usuário')
        const email = String(data.email ?? '')
        const initials = name
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0])
          .join('')
          .toUpperCase() || 'U'

        setUserActive({ name, email, initials })
      } catch (error) {
        if (active) setUserActive(null)
      }
    }

    loadUser()

    return () => {
      active = false
    }
  }, [])

  const displayUser = userActive ?? { name: 'Usuário', email: 'Carregando...', initials: 'U' }

  function handleLogout() {
    window.localStorage.removeItem('token')
    window.localStorage.removeItem('userId')
    router.push('/login')
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center justify-between px-5 h-16 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
            <Monogram />
        </Link>
        {onNavigate && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onNavigate}>
            <X className="size-4" />
          </Button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4">
        <p className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground font-mono">
          Menu
        </p>
        <ul className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
            {displayUser.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{displayUser.name}</p>
            <p className="truncate text-xs text-muted-foreground">{displayUser.email}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Sair"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
