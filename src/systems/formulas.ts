/**
 * FormulaEngine — all canonical math from Master Plan §17.
 * Uses Decimal throughout; pure functions, no side effects.
 */
import { Decimal, D, ZERO, ONE } from './Decimal'

// ── Central balance knobs ──────────────────────────────────────────────────
// The whole pacing of the game lives here. Tuning the grind = editing this block,
// not chasing magic numbers across every stage/component. (Master Plan §17.)
//
//  • milestoneMult / milestoneTiers — the single biggest lever on wealth growth.
//    Each tier a generator's count crosses grants a cumulative ×milestoneMult.
//    At the top tier the bonus is milestoneMult^(tiers.length).
//  • costGrowthBump — added to every generator's authored `costGrowth` (r). Lets us
//    steepen the whole climb without rewriting 40+ data values. So a data file that
//    reads r=1.07 actually charges r=1.07+costGrowthBump at runtime.
export const BALANCE = {
  milestoneMult: 2,                                         // was 8 — far gentler curve
  milestoneTiers: [10, 25, 50, 100, 250, 500, 1000, 2500], // finer + deeper than before
  costGrowthBump: 0.04,                                     // steepens every generator's cost
}

// Pre-calculated Milestone Multiplier cache to prevent allocations in sim loop
const MILESTONE_MULT_CACHE: Decimal[] = []
for (let i = 0; i <= BALANCE.milestoneTiers.length; i++) {
  MILESTONE_MULT_CACHE[i] = D(Math.pow(BALANCE.milestoneMult, i))
}

/** Authored cost growth `r` adjusted by the global bump. Single choke-point. */
export function effGrowth(r: number): number {
  return r + BALANCE.costGrowthBump
}

// ── Generator cost ────────────────────────────────────────────────────────
// cost_n = base * r^count   (r adjusted by the global cost-growth bump)
export function generatorCost(base: Decimal, r: number, count: number): Decimal {
  return base.mul(D(effGrowth(r)).pow(count))
}

// Bulk cost for buying `amount` generators from count → count+amount
// = base * r^count * (r^amount - 1) / (r - 1)
export function bulkGeneratorCost(base: Decimal, r: number, count: number, amount: number): Decimal {
  const rD = D(effGrowth(r))
  return base
    .mul(rD.pow(count))
    .mul(rD.pow(amount).sub(ONE))
    .div(rD.sub(ONE))
}

// How many generators can we afford from count with `budget`?
// Solve: budget >= base*r^count*(r^n-1)/(r-1)  => n = floor(log_r(budget*(r-1)/(base*r^count)+1))
export function maxAffordable(base: Decimal, r: number, count: number, budget: Decimal): number {
  if (budget.lte(ZERO)) return 0
  const rEff = effGrowth(r)
  const rD = D(rEff)
  const inner = budget.mul(rD.sub(ONE)).div(base.mul(rD.pow(count))).add(ONE)
  if (inner.lte(ZERO)) return 0
  let n = Math.max(0, Math.floor(inner.log(rEff).toNumber()))
  // The log floor sits within ~1 ULP of integer cost boundaries, so its result is
  // platform-fragile (Node/libm differences in Math.log/Math.pow flip k↔k-1). Correct
  // it exactly against real bulk costs: climb while the next unit still fits, then back
  // off while the current batch overshoots. The log estimate is within ±1, so this is
  // a couple of iterations — and it makes "buy max" exact and deterministic everywhere.
  while (bulkGeneratorCost(base, r, count, n + 1).lte(budget)) n++
  while (n > 0 && bulkGeneratorCost(base, r, count, n).gt(budget)) n--
  return n
}

// ── Production ────────────────────────────────────────────────────────────
// output = count * baseRate * tierMult * globalMult * dt
export function production(
  count: number,
  baseRate: Decimal,
  tierMult: Decimal,
  globalMult: Decimal,
  dt: number,
): Decimal {
  return baseRate.mul(count * dt).mul(tierMult).mul(globalMult)
}

// ── Milestone tier multiplier ─────────────────────────────────────────────
// Each tier crossed multiplies the generator's output by BALANCE.milestoneMult
// (cumulative). Tiers + multiplier are tuned centrally in BALANCE above.
export function milestoneMult(count: number): Decimal {
  let tierIndex = 0
  for (const t of BALANCE.milestoneTiers) {
    if (count >= t) tierIndex++
    else break
  }
  return MILESTONE_MULT_CACHE[tierIndex]
}

/** UI helper: the next milestone tier above `count` (or null if maxed),
 *  plus 0–1 progress toward it and the current cumulative multiplier. */
export function nextMilestoneInfo(count: number): {
  next: number | null
  prev: number
  progress: number
  currentMult: number
} {
  const tiers = BALANCE.milestoneTiers
  const next = tiers.find(t => t > count) ?? null
  const prev = [...tiers].reverse().find(t => t <= count) ?? 0
  const progress = next === null ? 1 : (count - prev) / (next - prev)
  let currentMult = 1
  for (const t of tiers) {
    if (count >= t) currentMult *= BALANCE.milestoneMult
    else break
  }
  return { next, prev, progress, currentMult }
}

// ── Paradox throttle (Time stage) ─────────────────────────────────────────
// All Chronon output is softly throttled when Paradox is high (MASTER_PLAN §7.2):
//   timeMult = 1 / (1 + (Paradox / 200)^0.5)
// → Paradox 0 → ×1.0, Paradox 200 → ×0.5, Paradox 800 → ×0.33.
export function paradoxThrottle(paradox: Decimal): Decimal {
  return ONE.div(ONE.add(paradox.div(D(200)).max(ZERO).pow(0.5)))
}

// ── Soft cap ──────────────────────────────────────────────────────────────
// eff(x) = C * (1 + (x-C)/C)^0.5  when x > C
export function softCap(x: Decimal, cap: Decimal): Decimal {
  if (x.lte(cap)) return x
  const excess = x.sub(cap).div(cap)
  return cap.mul(excess.add(ONE).pow(0.5))
}

// ── Stage prestige gain ───────────────────────────────────────────────────
// gain = floor( k * (lifetime / softcap)^0.5 )
export function prestigeGain(lifetime: Decimal, softcap: Decimal, k: number = 1): number {
  if (lifetime.lte(ZERO)) return 0
  const ratio = lifetime.div(softcap)
  return Math.floor(k * ratio.pow(0.5).toNumber())
}

// ── Ascension gain (Legacy Points) ─────────────────────────────────────────
// Deeper, harsher meta reset (MASTER_PLAN §"ASCENSION"): exponent 0.33 enforces a
// slower loop than stage prestige's 0.5.  LP = floor( k_A * (lifetime / C_A)^0.33 )
export const ASCENSION_K = 5
export function ascensionGain(lifetime: Decimal, softcap: Decimal, k: number = ASCENSION_K): number {
  if (lifetime.lte(ZERO)) return 0
  const ratio = lifetime.div(softcap)
  return Math.floor(k * ratio.pow(0.33).toNumber())
}

// ── Reality Reset gain (Omega Ω) ────────────────────────────────────────────
// Top meta layer: cube-root of all-time Aether for brutal, deliberate pacing.
//   Ω = floor( cbrt(aetherLifetime / OMEGA_SOFTCAP) · (1 + 0.15·multLevel) )
// `multLevel` is the om:reality_multiplier skill level (+15% Ω gain per level).
// Aether counts stay well under 1e15, so this uses native Math (no Decimal).
// Uses Math.cbrt (not pow(x, 1/3)) + a tiny epsilon so perfect cubes (8000 → 20)
// aren't eaten by float error (pow(8000, 1/3) = 19.999…) before the floor.
export const OMEGA_SOFTCAP = 1e3
export function omegaGain(aetherLifetime: number, multLevel = 0): number {
  if (aetherLifetime <= 0) return 0
  const base = Math.cbrt(aetherLifetime / OMEGA_SOFTCAP)
  return Math.floor(base * (1 + 0.15 * multLevel) + 1e-9)
}

// ── Fortune mint rate ─────────────────────────────────────────────────────
// dStar/dt = SUM( log10(1 + surplus) * weight * engineMult )
export function fortuneMintRate(
  surpluses: { surplus: Decimal; weight: number }[],
  engineMult: Decimal,
  dt: number,
): Decimal {
  let total = ZERO
  for (const { surplus, weight } of surpluses) {
    if (surplus.lte(ZERO)) continue
    const contrib = surplus.add(ONE).log10().mul(D(weight))
    total = total.add(contrib)
  }
  return total.mul(engineMult).mul(D(dt))
}

// ── Offline gain ─────────────────────────────────────────────────────────
// 100% rate up to baseWindow (s), then offlinePct% beyond, capped at maxWindow (s)
export function offlineGain(
  ratePerSec: Decimal,
  elapsedSec: number,
  baseWindow = 7200,
  offlinePct = 0.35,
  maxWindow = 86400,
): Decimal {
  const capped = Math.min(elapsedSec, maxWindow)
  const full   = Math.min(capped, baseWindow)
  const partial = Math.max(0, capped - baseWindow)
  return ratePerSec.mul(full + partial * offlinePct)
}

// ── Exchange rate with tax ────────────────────────────────────────────────
// converted = amount * rate * (1 - tax)^conversions  (diminishing returns)
export function exchange(
  amount: Decimal,
  rate: Decimal,
  tax: number,
  conversions: number,
): Decimal {
  const effectiveTax = 1 - Math.pow(1 - tax, conversions)
  const netRate = rate.mul(D(1 - effectiveTax))
  return amount.mul(netRate)
}
