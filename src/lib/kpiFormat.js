const SUFFIX_MULTIPLIER = { k: 1e3, m: 1e6, b: 1e9 }
const CURRENCY_SYMBOL = /^[$€£¥]/

/**
 * Parse a KPI value string into a numeric amount plus display decoration.
 *
 * Understands currency prefixes ($, €, £, ¥, USD), compact suffixes
 * (k/M/B) and a percent sign. Returns null for non-numeric values.
 */
export function parseKpiValue(value) {
  if (value == null) return null
  const raw = String(value).trim()
  if (!raw) return null

  let prefix = ''
  const curMatch = raw.match(CURRENCY_SYMBOL)
  if (curMatch) prefix = curMatch[0]

  let compact = prefix ? raw.slice(prefix.length).trim() : raw

  const wordCurrency = compact.match(/^(?:USD|EUR|GBP)\b\s*/i)
  if (wordCurrency) {
    compact = compact.slice(wordCurrency[0].length)
    prefix = prefix || '$'
  }

  const isPercent = compact.endsWith('%')
  if (isPercent) compact = compact.slice(0, -1).trim()

  const m = compact.match(/^(-?[\d.,]+)\s*([kKmMbB])?$/)
  if (!m) return null

  const num = parseFloat(m[1].replace(/,/g, ''))
  if (!Number.isFinite(num)) return null

  const multiplier = m[2] ? SUFFIX_MULTIPLIER[m[2].toLowerCase()] : 1

  return {
    amount: num * multiplier,
    prefix,
    suffix: isPercent ? '%' : '',
  }
}

export function formatKpiAmount(amount) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatKpiValue(value) {
  const parsed = parseKpiValue(value)
  if (!parsed) return String(value)
  return `${parsed.prefix}${formatKpiAmount(parsed.amount)}${parsed.suffix}`
}