// دوال مساعدة مشتركة

export const normalizePeriod = (p) => {
  if (!p) return ''
  if (p === 'صباح' || (typeof p === 'string' && p.toLowerCase() === 'morning')) return 'morning'
  if (p === 'مساء' || (typeof p === 'string' && p.toLowerCase() === 'evening')) return 'evening'
  return p
}

export const getScoreColor = (score) => {
  if (score >= 8) return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
  if (score >= 6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'
  return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
}

export const getRankBorder = (index) => {
  if (index === 0) return 'gold-border'
  if (index === 1) return 'silver-border'
  if (index === 2) return 'bronze-border'
  return 'border-gray-200 dark:border-gray-700'
}

export const getRankBadge = (index) => {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return null
}

