/** @typedef {'day' | 'month' | 'year'} DungLuongNhom */
/** @typedef {'all' | 'year' | 'month' | 'custom'} MauKhoangThoiGian */

export function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfDay(d) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/** @param {Date} d */
export function toYMD(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * @param {MauKhoangThoiGian} preset
 * @param {string} customFrom YYYY-MM-DD
 * @param {string} customTo YYYY-MM-DD
 * @returns {{ from: Date | null, to: Date | null }}
 */
export function boundsForPreset(preset, customFrom, customTo) {
  const now = new Date()
  switch (preset) {
    case 'all':
      return { from: null, to: null }
    case 'year':
      return {
        from: startOfDay(new Date(now.getFullYear(), 0, 1)),
        to: endOfDay(now),
      }
    case 'month':
      return {
        from: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: endOfDay(now),
      }
    case 'custom': {
      if (!customFrom?.trim() || !customTo?.trim()) {
        return { from: null, to: null }
      }
      const a = startOfDay(new Date(`${customFrom.trim()}T00:00:00`))
      const b = endOfDay(new Date(`${customTo.trim()}T00:00:00`))
      if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
        return { from: null, to: null }
      }
      return a.getTime() <= b.getTime() ? { from: a, to: b } : { from: b, to: a }
    }
    default:
      return { from: null, to: null }
  }
}

/**
 * @param {Array<{ traded_at: string, pnl?: number }>} journals
 * @param {{ from: Date | null, to: Date | null }} bounds
 */
export function filterJournalsByRange(journals, bounds) {
  const { from, to } = bounds
  if (!from && !to) return journals
  return journals.filter((j) => {
    const t = new Date(j.traded_at).getTime()
    if (Number.isNaN(t)) return false
    if (from && t < from.getTime()) return false
    if (to && t > to.getTime()) return false
    return true
  })
}

/**
 * @param {string} iso
 * @param {DungLuongNhom} g
 */
export function bucketSortKey(iso, g) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  if (g === 'year') return `${y}`
  if (g === 'month') return `${y}-${String(m).padStart(2, '0')}`
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * @param {string} key
 * @param {DungLuongNhom} g
 */
export function labelForBucket(key, g) {
  if (!key) return ''
  if (g === 'year') return key
  if (g === 'month') {
    const [y, mo] = key.split('-').map(Number)
    if (!y || !mo) return key
    return new Date(y, mo - 1, 1).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })
  }
  const [y, mo, da] = key.split('-').map(Number)
  if (!y || !mo || !da) return key
  return new Date(y, mo - 1, da).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
}

/**
 * @param {Array<{ traded_at: string, pnl?: number }>} journals
 * @param {DungLuongNhom} granularity
 * @returns {Array<{ key: string, label: string, pnl: number, trades: number, wins: number }>}
 */
export function aggregatePnlByBucket(journals, granularity) {
  /** @type {Map<string, { pnl: number, trades: number, wins: number }>} */
  const map = new Map()
  for (const j of journals) {
    const key = bucketSortKey(j.traded_at, granularity)
    if (!key) continue
    const pnl = Number(j.pnl) || 0
    const cur = map.get(key) || { pnl: 0, trades: 0, wins: 0 }
    cur.pnl = Number((cur.pnl + pnl).toFixed(2))
    cur.trades += 1
    if (pnl > 0) cur.wins += 1
    map.set(key, cur)
  }
  const keys = [...map.keys()].sort()
  return keys.map((key) => ({
    key,
    label: labelForBucket(key, granularity),
    pnl: map.get(key).pnl,
    trades: map.get(key).trades,
    wins: map.get(key).wins,
  }))
}

/**
 * Chuỗi lãi lỗ luỹ kế cho biểu đồ (sắp xếp theo traded_at).
 * @param {Array<{ traded_at: string, pnl?: number }>} journals
 */
export function cumulativePnlSeries(journals) {
  const sorted = [...journals].sort((a, b) => new Date(a.traded_at) - new Date(b.traded_at))
  let cum = 0
  return sorted.map((j, idx) => {
    cum = Number((cum + (Number(j.pnl) || 0)).toFixed(2))
    return {
      i: idx + 1,
      label: new Date(j.traded_at).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
      cumulative: cum,
    }
  })
}
