/**
 * Mine stage — unlocks once the Farm is established.
 * Cross-stage (compounding): Village LABOR ×, and Farm GRAIN feeds the miners ×.
 * Numbers follow MASTER_PLAN §17 baselines (r ≈ 1.08 early → 1.15 late).
 */
import { D } from '../../systems/Decimal'
import type { StageDefinition, GeneratorDef } from '../types'

const generators: GeneratorDef[] = [
  {
    id: 'prospector',
    name: 'Prospector',
    emoji: '⛏️',
    description: 'A lone pick chipping at the seam. Slow, honest Ore.',
    baseCost: D(25),
    costGrowth: 1.08,
    baseRate: D(0.18),   // Ore/s
    unlockAt: 0,
  },
  {
    id: 'shaft',
    name: 'Mine Shaft',
    emoji: '🕳️',
    description: 'Sinks deeper into the rock — and glints with the first Gems.',
    baseCost: D(180),
    costGrowth: 1.08,
    baseRate: D(1.1),
    secondaryRate: D(0.12), // Gems/s
    unlockAt: 0,
  },
  {
    id: 'drill',
    name: 'Steam Drill',
    emoji: '🔩',
    description: 'Bores through stone tirelessly while the miners rest.',
    baseCost: D(1400),
    costGrowth: 1.09,
    baseRate: D(6),
    unlockAt: 0,
  },
  {
    id: 'gemvein',
    name: 'Gem Vein',
    emoji: '💎',
    description: 'A rich crystalline seam. Ore by the cartload, Gems besides.',
    baseCost: D(9000),
    costGrowth: 1.10,
    baseRate: D(26),
    secondaryRate: D(0.4),
    unlockAt: 0,
  },
  {
    id: 'smelter',
    name: 'Smelter',
    emoji: '🔥',
    description: 'Refines the haul on site. All Mine output ×1.5.',
    baseCost: D(70000),
    costGrowth: 1.11,
    baseRate: D(100),
    globalStageMult: 1.5,
    unlockAt: 0,
  },
  {
    id: 'excavator',
    name: 'Excavator',
    emoji: '🚜',
    description: 'Tears open whole galleries in a single shift.',
    baseCost: D(450000),
    costGrowth: 1.12,
    baseRate: D(360),
    unlockAt: 1,
  },
  {
    id: 'corecrusher',
    name: 'Core Crusher',
    emoji: '⚙️',
    description: 'Grinds the planet\'s heart to powder. All Mine production ×8.',
    baseCost: D(6e6),
    costGrowth: 1.15,
    baseRate: D(1700),
    globalStageMult: 8,
    unlockAt: 2,
  },
]

const mineDef: StageDefinition = {
  id: 'mine',
  name: 'Mine',
  emoji: '⛏️',
  theme: 'deep caverns',
  primaryCurrency: { id: 'ore', name: 'Ore', symbol: '🪨', emoji: '🪨' },
  secondaryCurrency: { id: 'gems', name: 'Gems', symbol: '💎', emoji: '💎' },
  prestigeCurrency: { id: 'depth', name: 'Depth', symbol: 'D', emoji: '🔻' },
  generators,
  fortuneWeight: 1.4,
  prestigeSoftcap: D(1e8),
  prestigeK: 1,
  description:
    'Lantern-lit galleries beneath the world. Fed by Village hands and Farm grain, the miners never tire.',
  unlockCondition: 'Earn 5,000 lifetime Grain in the Farm.',
  color: '#9b7fd4',
  bgColor: '#1c1630',
}

export default mineDef
