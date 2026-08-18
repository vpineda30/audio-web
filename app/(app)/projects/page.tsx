'use client'

import { NewProjectDialog } from '@/components/new-project-dialog'
import { PageHeader } from '@/components/page-header'
import { ProjectsGrid } from '@/components/projects-grid'
import { projects } from '@/lib/data'
import { motion } from 'framer-motion'

export default function ProjectsPage() {
  return (
    <motion.div className="flex flex-col gap-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <PageHeader
        eyebrow="Biblioteca"
        title="Projetos"
        description="Organize suas faixas em projetos. Clique em um projeto para ver e reproduzir as faixas."
        action={<NewProjectDialog />}
      />
      <ProjectsGrid projects={projects} />
    </motion.div>
  )
}
