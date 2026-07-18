export function formatChips(amount: number): string {
  return new Intl.NumberFormat('en-US').format(amount)
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function formatActionType(type: string): string {
  const map: Record<string, string> = {
    fold: 'Fold',
    check: 'Check',
    call: 'Call',
    bet: 'Bet',
    raise: 'Raise',
    'all-in': 'All-in',
    rebuy: 'Rebuy',
    sit_out: 'Sit Out',
    return: 'Return'
  }
  return map[type] || type
}
