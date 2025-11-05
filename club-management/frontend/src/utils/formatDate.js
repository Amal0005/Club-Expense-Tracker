export function formatDMY(dateLike) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatMonthKeyToDMY(monthKey) {
  // monthKey is expected as YYYY-MM
  if (!monthKey || typeof monthKey !== 'string' || monthKey.length < 7) return '-'
  const d = new Date(`${monthKey}-01`)
  return formatDMY(d)
}

export function formatMonthYear(input) {
  const d = input && typeof input === 'string' && input.length === 7
    ? new Date(`${input}-01`)
    : (input instanceof Date ? input : new Date(input))
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}
