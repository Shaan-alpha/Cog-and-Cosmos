/**
 * Time stage — Temporal Dimension
 * Twist: Warp-Tick Bursts. Chronons buy warp ticks — bundles of simulated game-time
 * applied to ANY chosen stage (burst offline-like gains on demand). Paradox is the
 * risk-resource: over-warping accrues Paradox that throttles all Time output until vented.
 * Numbers follow MASTER_PLAN §7.
 */
import { D } from '../../systems/Decimal'
import type { StageDefinition, GeneratorDef } from '../types'

const generators: GeneratorDef[] = [
  {
    id: 'sundial',
    name: 'Sundial',
    emoji: '🌇',
    description: 'The first clock. A patient bootstrap producer of Chronons.',
    baseCost: D(200),
    costGrowth: 1.10,
    baseRate: D(0.4), // Chronons/s
    unlockAt: 0,
  },
  {
    id: 'clocktower',
    name: 'Clocktower',
    emoji: '🕰️',
    description: 'Tolls the hours. Each 25 owned sharpens warp efficiency (+1.5% per milestone).',
    baseCost: D(2.5e3),
    costGrowth: 1.11,
    baseRate: D(3), // Chronons/s
    unlockAt: 0,
  },
  {
    id: 'loop',
    name: 'Causal Loop',
    emoji: '🔁',
    description: 'Folds a moment back on itself. +18 Chronons/s, but leaks 0.02 Paradox/s.',
    baseCost: D(4.0e4),
    costGrowth: 1.12,
    baseRate: D(18), // Chronons/s — paradox handled in the Time economy branch
    unlockAt: 0,
  },
  {
    id: 'hourglassarray',
    name: 'Hourglass Array',
    emoji: '⏳',
    description: 'Bleeds excess Paradox safely away — vents 0.5 Paradox/s each.',
    baseCost: D(7.0e5),
    costGrowth: 1.13,
    baseRate: D(0), // produces no Chronons; vents Paradox (Time branch)
    unlockAt: 0,
  },
  {
    id: 'chronoengine',
    name: 'Chrono-Engine',
    emoji: '⚙️',
    description: 'Industrial-scale time pressure. +140 Chronons/s and +1 warp charge cap each.',
    baseCost: D(1.5e7),
    costGrowth: 1.14,
    baseRate: D(140), // Chronons/s
    unlockAt: 1,
  },
  {
    id: 'eternityspindle',
    name: 'Eternity Spindle',
    emoji: '🌀',
    description: 'Spins raw eternity into Chronons. +1,500 Chronons/s; all warp ticks ×1.5.',
    baseCost: D(5.0e8),
    costGrowth: 1.15,
    baseRate: D(1500), // Chronons/s
    globalStageMult: 1.5,
    unlockAt: 2,
  },
]

const timeDef: StageDefinition = {
  id: 'time',
  name: 'Time',
  emoji: '⏳',
  theme: 'temporal dimension',
  primaryCurrency: { id: 'chronons', name: 'Chronons', symbol: '⧖', emoji: '⧖' },
  secondaryCurrency: { id: 'paradox', name: 'Paradox', symbol: '⚠', emoji: '🌀' },
  prestigeCurrency: { id: 'epoch', name: 'Epoch', symbol: 'Æ', emoji: '🜲' },
  generators,
  fortuneWeight: 2.25,
  prestigeSoftcap: D(1e7),
  prestigeK: 6,
  description:
    'The compressed axis. Spend Chronons on warp ticks to burst any stage forward in time — but mind the Paradox that builds with every fold.',
  unlockCondition: 'Reach 5,000,000 lifetime Stardust in Space, with any two stages ascended at least once.',
  color: '#e6a93f',
  bgColor: '#1d1606',
}

export default timeDef
