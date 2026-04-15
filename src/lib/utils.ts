import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const then = new Date(date).getTime()
  if (Number.isNaN(then)) return '—'
  const diffMs = Date.now() - then
  if (diffMs < 0) return 'just now'

  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return `${sec}s ago`

  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}min${min === 1 ? '' : 's'} ago`

  const hr = Math.floor(min / 60)
  if (hr < 24) {
    const remMin = min % 60
    return remMin ? `${hr}h ${remMin}min${remMin === 1 ? '' : 's'} ago` : `${hr}h ago`
  }

  const day = Math.floor(hr / 24)
  if (day < 7) {
    const remHr = hr % 24
    return remHr ? `${day}d ${remHr}h ago` : `${day}d ago`
  }

  const week = Math.floor(day / 7)
  if (week < 5) return `${week}w${week === 1 ? '' : ''} ago`

  const month = Math.floor(day / 30)
  if (month < 12) return `${month}mo ago`

  const year = Math.floor(day / 365)
  const remMo = Math.floor((day % 365) / 30)
  return remMo ? `${year}y ${remMo}mo ago` : `${year}y ago`
}
