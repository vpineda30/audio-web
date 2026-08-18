export type TrackFormat = 'mp3' | 'wav'

export type Track = {
  id: string
  name: string
  format: TrackFormat
  duration: number
  sizeMB: number
  bpm: number
  key: string
  addedAt: string
  src: string
  versionName?: string
}

export const trackKeyOptions = [
  { value: 'C', label: 'C' },
  { value: 'Csharp', label: 'C#' },
  { value: 'D', label: 'D' },
  { value: 'Dsharp', label: 'D#' },
  { value: 'E', label: 'E' },
  { value: 'F', label: 'F' },
  { value: 'Fsharp', label: 'F#' },
  { value: 'G', label: 'G' },
  { value: 'Gsharp', label: 'G#' },
  { value: 'A', label: 'A' },
  { value: 'Asharp', label: 'A#' },
  { value: 'B', label: 'B' },
] as const

export function formatTrackKey(key: string | null | undefined) {
  if (!key) return 'Indefinido'

  const option = trackKeyOptions.find((option) => option.value.toLowerCase() === key.toLowerCase())
  return option ? option.label : key
}

export function normalizeTrackKey(key: string) {
  if (!key) return ''

  const normalized = key.replace('#', 'sharp').toLowerCase()
  const option = trackKeyOptions.find((option) => option.value.toLowerCase() === normalized)
  return option ? option.value : key
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tracks: Track[]
  size: number
  color: string;
  createAt: string
  updateAt: string
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  storageUsed: number;
  projects: Project[]
  stripeCustomerId: string | null;
  subscriptionPlan: Plan;
  subscriptionStatus:
  | "active"
  | "inactive"
  | "trialing"
  | "past_due"
  | "canceled";
  createdAt: string;
  updateAt: string
}

type Plan = "FREE" | "PRO";

export const planLimits: Record<Plan, {
  storageSize?: number;
  projects: number;
}> = {
  FREE: {
    storageSize: 500,
    projects: 5,
  },
  PRO: {
    storageSize: 10,
    projects: Infinity,
  },
};

const audio = (n: number) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`

export const projects: Project[] = []

export function getProject(id: string) {
  return projects.find((p) => p.id === id)
}

export const allTracks = projects.flatMap((p) =>
  p.tracks.map((t) => ({ ...t, projectId: p.id, projectName: p.name })),
)

export const totalTracks = allTracks.length
export const usedStorageGB = Number(
  (allTracks.reduce((sum, t) => sum + t.sizeMB, 0) / 1024).toFixed(2),
)

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatFileSize(sizeMB: number) {
  if (sizeMB < 1024) {
    return `${sizeMB.toFixed(2)} MB`
  } else {
    const sizeGB = sizeMB / 1024
    return `${sizeGB.toFixed(2)} GB`
  }
}

export function formatDate(iso: string | Date | null | undefined) {
  if (!iso) return '—'

  const date = iso instanceof Date ? iso : new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
