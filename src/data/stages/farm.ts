/**
 * Farm stage — unlocks once the Village is established.
 * Cross-stage: Village Townsfolk LABOR multiplies all Farm output (see store binding).
 * Numbers follow the MASTER_PLAN §17 baselines (r ≈ 1.08 early → 1.15 late).
 */
import { D } from '../../systems/Decimal'
import type { StageDefinition, GeneratorDef } from '../types'

const generators: GeneratorDef[] = [
  {
    id: 'field',
    name: 'Tilled Field',
    emoji: '🌱',
    description: 'A furrowed plot. Grain ripens with every passing season.',
    baseCost: D(20),
    costGrowth: 1.08,
    baseRate: D(0.15),   // Grain/s
    unlockAt: 0,
  },
  {
    id: 'well',
    name: 'Stone Well',
    emoji: '💧',
    description: 'Draws Water to irrigate the fields — and waters the whole farm.',
    baseCost: D(150),
    costGrowth: 1.08,
    baseRate: D(1),
    secondaryRate: D(0.15), // Water/s
    unlockAt: 0,
  },
  {
    id: 'livestock',
    name: 'Livestock Pen',
    emoji: '🐄',
    description: 'Beasts that turn feed into fortune. Hungry, but worth it.',
    baseCost: D(1200),
    costGrowth: 1.09,
    baseRate: D(5),
    unlockAt: 0,
  },
  {
    id: 'orchard',
    name: 'Orchard',
    emoji: '🍎',
    description: 'Rows of heavy-laden trees. Patience, then plenty.',
    baseCost: D(8000),
    costGrowth: 1.10,
    baseRate: D(22),
    unlockAt: 0,
  },
  {
    id: 'granary',
    name: 'Granary',
    emoji: '🛖',
    description: 'Stores the harvest and steadies supply. All Farm output ×1.5.',
    baseCost: D(60000),
    costGrowth: 1.11,
    baseRate: D(90),
    globalStageMult: 1.5,
    unlockAt: 0,
  },
  {
    id: 'windmill',
    name: 'Windmill',
    emoji: '🌬️',
    description: 'Grinds grain into wealth on the turning of the wind.',
    baseCost: D(400000),
    costGrowth: 1.12,
    baseRate: D(320),
    unlockAt: 1,
  },
  {
    id: 'estate',
    name: 'Estate',
    emoji: '🚜',
    description: 'A grand agricultural seat. All Farm production ×8.',
    baseCost: D(5e6),
    costGrowth: 1.15,
    baseRate: D(1500),
    globalStageMult: 8,
    unlockAt: 2,
  },
]

const farmDef: StageDefinition = {
  id: 'farm',
  name: 'Farm',
  emoji: '🌾',
  theme: 'pastoral agriculture',
  primaryCurrency: { id: 'grain', name: 'Grain', symbol: '🌾', emoji: '🌾' },
  secondaryCurrency: { id: 'water', name: 'Water', symbol: '💧', emoji: '💧' },
  prestigeCurrency: { id: 'heritage', name: 'Heritage', symbol: 'H', emoji: '🌿' },
  generators,
  fortuneWeight: 1.2,
  prestigeSoftcap: D(1e7),
  prestigeK: 1,
  description:
    'Golden fields fed by Village hands. The more Townsfolk labor the Village exports, the richer every harvest.',
  unlockCondition: 'Earn 5,000 lifetime Coins in the Village.',
  color: '#e0b84a',
  bgColor: '#2a2410',
}

export default farmDef
