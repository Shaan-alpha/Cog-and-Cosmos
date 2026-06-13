// Thin re-export + helpers so the rest of the codebase never imports break_eternity directly.
import Decimal from 'break_eternity.js'
export { Decimal }
export type Dec = Decimal

export const D = (v: number | string | Decimal): Decimal => new Decimal(v)
export const ZERO = D(0)
export const ONE  = D(1)

/** Human-readable notation: 1.23M, 4.56B, 1.23e15 */
export function fmt(v: Decimal | number, format?: 'short' | 'scientific' | 'engineering', decimals = 2): string {
  const d = v instanceof Decimal ? v : D(v)
  if (d.lt(1e3)) return d.toFixed(decimals)

  if (!format || format === 'short') {
    if (d.lt(1e6))  return (d.div(1e3).toFixed(decimals)) + 'K'
    if (d.lt(1e9))  return (d.div(1e6).toFixed(decimals)) + 'M'
    if (d.lt(1e12)) return (d.div(1e9).toFixed(decimals)) + 'B'
    if (d.lt(1e15)) return (d.div(1e12).toFixed(decimals)) + 'T'
    if (d.lt(1e18)) return (d.div(1e15).toFixed(decimals)) + 'Qa'
    if (d.lt(1e21)) return (d.div(1e18).toFixed(decimals)) + 'Qi'
    return d.toExponential(decimals)
  }

  if (format === 'scientific') {
    return d.toExponential(decimals)
  }

  if (format === 'engineering') {
    const exp = d.e
    const remainder = exp % 3
    const engExp = exp - remainder
    const engMant = d.m * Math.pow(10, remainder)
    return engMant.toFixed(decimals) + 'e' + engExp
  }

  return d.toString()
}

/** Rate display: per second label */
export function fmtRate(v: Decimal | number): string {
  return fmt(v) + '/s'
}

// @ts-ignore
Decimal.prototype.toJSON = function (this: Decimal) {
  return { __decimal__: this.toString() }
}
