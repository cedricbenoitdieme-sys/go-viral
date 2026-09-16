const compactFormatter = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })
const fullFormatter = new Intl.NumberFormat('fr-FR')
const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })
const dateTimeFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

export function formatCompact(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return compactFormatter.format(n)
}

export function formatFull(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return fullFormatter.format(n)
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return dateFormatter.format(new Date(iso))
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  return dateTimeFormatter.format(new Date(iso))
}
