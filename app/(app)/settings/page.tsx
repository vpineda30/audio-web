"use client"

import { PageHeader } from '@/components/page-header'
import { SettingsView } from '@/components/settings-view'
import { motion } from 'framer-motion'

export default function SettingsPage() {
  return (
    <motion.div className="flex flex-col gap-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        eyebrow="Conta"
        title="Configurações"
        description="Gerencie seu perfil, plano e preferências de notificação."
      />
      <SettingsView />
    </motion.div>
  )
}
