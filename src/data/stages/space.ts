/**
 * Space stage — Orbital Expansion
 * Twist: Input-chain manufacturing. Smelters and Refineries consume Mine Ore and Factory Power
 * to produce Alloy. Probes and Colonies consume Alloy to produce Stardust.
 * Numbers follow MASTER_PLAN §17 baselines.
 */
import { D } from '../../systems/Decimal'
import type { StageDefinition, GeneratorDef } from '../types'

const generators: GeneratorDef[] = [
  {
    id: 'smelter',
    name: 'Alloy Smelter',
    emoji: '☄️',
    description: 'Fuses Mine Ore and Factory Power into aerospace-grade Alloy. Consumes 5 Ore + 2 kW/s.',
    baseCost: D(1.0e4),
    costGrowth: 1.10,
    baseRate: D(0),
    secondaryRate: D(1.0), // Alloy/s
    unlockAt: 0,
  },
  {
    id: 'probe',
    name: 'Telemetry Probe',
    emoji: '🛰️',
    description: 'Launches into orbit. Consumes 3 Alloy/s to transmit 6 Stardust/s.',
    baseCost: D(4.0e4),
    costGrowth: 1.11,
    baseRate: D(6.0),   // Stardust/s
    unlockAt: 0,
  },
  {
    id: 'refinery',
    name: 'Orbital Refinery',
    emoji: '🏭',
    description: 'A floating refinery with higher throughput. Consumes 12 Ore + 5 kW/s to make 4 Alloy/s.',
    baseCost: D(7.0e5),
    costGrowth: 1.12,
    baseRate: D(0),
    secondaryRate: D(4.0), // Alloy/s
    unlockAt: 0,
  },
  {
    id: 'colony',
    name: 'Biosphere Colony',
    emoji: '🛸',
    description: 'A self-contained dome. Consumes 10 Alloy/s to produce 55 Stardust/s.',
    baseCost: D(1.2e7),
    costGrowth: 1.13,
    baseRate: D(55.0),  // Stardust/s
    unlockAt: 0,
  },
  {
    id: 'dysonframe',
    name: 'Dyson Frame',
    emoji: '🕸️',
    description: 'Constructs the skeleton of a megastructure. Consumes 40 Ore + 30 kW/s to make 25 Alloy/s. All Space output ×1.5.',
    baseCost: D(3.0e8),
    costGrowth: 1.14,
    baseRate: D(0),
    secondaryRate: D(25.0), // Alloy/s
    globalStageMult: 1.5,
    unlockAt: 0,
  },
  {
    id: 'starforge',
    name: 'Star Forge',
    emoji: '🌟',
    description: 'Ignites stellar material. Consumes 90 Alloy/s to produce 900 Stardust/s.',
    baseCost: D(9.0e9),
    costGrowth: 1.15,
    baseRate: D(900.0), // Stardust/s
    unlockAt: 1,
  },
  {
    id: 'warpgate',
    name: 'Warp Gate',
    emoji: '🌀',
    description: 'A portal to the outer reaches. Consumes 200 Alloy/s to produce 6,000 Stardust/s. All Space production ×8.',
    baseCost: D(8.0e10),
    costGrowth: 1.15,
    baseRate: D(6000.0), // Stardust/s
    globalStageMult: 8,
    unlockAt: 2,
  },
]

const spaceDef: StageDefinition = {
  id: 'space',
  name: 'Space',
  emoji: '🚀',
  theme: 'orbital expansion',
  primaryCurrency: { id: 'stardust', name: 'Stardust', symbol: '✨', emoji: '✨' },
  secondaryCurrency: { id: 'alloy', name: 'Alloy', symbol: '🔩', emoji: '🔩' },
  prestigeCurrency: { id: 'telemetry', name: 'Telemetry', symbol: 'T', emoji: '📡' },
  generators,
  fortuneWeight: 2.00,
  prestigeSoftcap: D(5e7),
  prestigeK: 8,
  description:
    'The silent frontier. Smelt Mine Ore and Factory Power into Alloy, then fuel probes and colonies to harvest Stardust.',
  unlockCondition: 'Earn 500,000 lifetime Ore in the Mine and sustain 1,000 kW/s of Power.',
  color: '#4ec0d4',
  bgColor: '#0c1b20',
}

export default spaceDef
