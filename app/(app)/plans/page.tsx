'use client'

import { PageHeader } from '@/components/page-header'
import { PlansView } from '@/components/plans-view'
import { motion } from 'framer-motion'

export default function PlansPage() {
  return (
    <motion.div className="flex flex-col gap-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        eyebrow="Assinatura"
        title="Planos"
        description="Escolha o plano ideal para o seu fluxo de trabalho. Faça upgrade a qualquer momento."
      />
      <PlansView />
    </motion.div>
  )
}
