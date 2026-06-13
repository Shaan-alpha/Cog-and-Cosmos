/**
 * Village stage definition — all static data.
 * Numbers match the Master Plan §17 baselines:
 *   cost growth r = 1.07, baseRate in ¢/s per generator.
 */
import { D } from '../../systems/Decimal'
import type { StageDefinition, GeneratorDef } from '../types'

const generators: GeneratorDef[] = [
  {
    id: 'cottage',
    name: 'Cottage',
    emoji: '🏠',
    description: 'A humble home. Townsfolk trickle out each morning.',
    baseCost: D(10),
    costGrowth: 1.07,
    baseRate: D(0.5),   // ¢/s
    laborOutput: 0.05,  // labor units/s per cottage (feeds Farm/Mine)
    unlockAt: 0,
  },
  {
    id: 'market',
    name: 'Market Stall',
    emoji: '🛒',
    description: 'Coins flow faster when merchants cry their wares.',
    baseCost: D(80),
    costGrowth: 1.07,
    baseRate: D(0.5),
    unlockAt: 1,  // requires 1 prestige
  },
  {
    id: 'tavern',
    name: 'Tavern',
    emoji: '🍺',
    description: 'Warmth and ale. Doubles the happiness of nearby cottages.',
    baseCost: D(500),
    costGrowth: 1.08,
    baseRate: D(2),
    unlockAt: 0,
  },
  {
    id: 'blacksmith',
    name: 'Blacksmith',
    emoji: '⚒️',
    description: 'Forges tools sold in the market — a secondary Wood income.',
    baseCost: D(3000),
    costGrowth: 1.09,
    baseRate: D(8),
    secondaryRate: D(0.2), // secondary Wood/s
    unlockAt: 0,
  },
  {
    id: 'guildhall',
    name: 'Guild Hall',
    emoji: '🏛️',
    description: 'Organises all workers. Multiplies every generator by 1.5.',
    baseCost: D(20000),
    costGrowth: 1.10,
    baseRate: D(25),
    globalStageMult: 1.5,
    unlockAt: 0,
  },
  {
    id: 'cathedral',
    name: 'Cathedral',
    emoji: '⛪',
    description: 'Blessings rain upon the village. Triples Cottage labor output.',
    baseCost: D(200000),
    costGrowth: 1.12,
    baseRate: D(100),
    unlockAt: 2, // requires 2 prestige
  },
  {
    id: 'castle',
    name: 'Castle',
    emoji: '🏰',
    description: 'The lord rules. All Village production ×10.',
    baseCost: D(5e6),
    costGrowth: 1.15,
    baseRate: D(500),
    globalStageMult: 10,
    unlockAt: 3,
  },
]

const villageDef: StageDefinition = {
  id: 'village',
  name: 'Village',
  emoji: '🏡',
  theme: 'medieval hamlet',
  primaryCurrency: { id: 'coins', name: 'Coins', symbol: '¢', emoji: '🪙' },
  secondaryCurrency: { id: 'wood', name: 'Wood', symbol: '🌲', emoji: '🌲' },
  prestigeCurrency: { id: 'renown', name: 'Renown', symbol: 'R', emoji: '⭐' },
  generators,
  fortuneWeight: 1.0,
  prestigeSoftcap: D(1e6),
  prestigeK: 1,
  description:
    'A quiet hamlet at the edge of the world. Townsfolk earn Coins and chop Wood. Their Labor flows to the Farm and Mine.',
  unlockCondition: 'Start of game',
  color: '#8fbc8f',
  bgColor: '#1a2a1a',
}

export default villageDef
