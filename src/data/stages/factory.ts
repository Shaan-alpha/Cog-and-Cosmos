/**
 * Factory stage — unlocks once the Mine is established.
 * Cross-stage: Farm GRAIN feeds the workers.
 * Numbers follow the MASTER_PLAN §17 baselines (r ≈ 1.08 early → 1.15 late).
 */
import { D } from '../../systems/Decimal'
import type { StageDefinition, GeneratorDef } from '../types'

const generators: GeneratorDef[] = [
  {
    id: 'boilerassistant',
    name: 'Boiler Assistant',
    emoji: '👨‍🔧',
    description: 'Tends the flames to keep steam pressure rising. Slow, honest Widgets.',
    baseCost: D(30),
    costGrowth: 1.09,
    baseRate: D(0.20),   // Widgets/s
    unlockAt: 0,
  },
  {
    id: 'coalburner',
    name: 'Coal Burner',
    emoji: '⚡',
    description: 'Burns fuel to generate steam power. Generates Power.',
    baseCost: D(220),
    costGrowth: 1.09,
    baseRate: D(1.2),
    secondaryRate: D(0.18), // Power/s (kW)
    unlockAt: 0,
  },
  {
    id: 'assemblyline',
    name: 'Assembly Line',
    emoji: '⚙️',
    description: 'Conveyor belts that stamp out brass fittings at speed.',
    baseCost: D(1600),
    costGrowth: 1.10,
    baseRate: D(7.0),
    unlockAt: 0,
  },
  {
    id: 'smeltingoven',
    name: 'Smelting Oven',
    emoji: '🧱',
    description: 'Consumes coal and ore to generate heavy power.',
    baseCost: D(10000),
    costGrowth: 1.11,
    baseRate: D(30.0),
    secondaryRate: D(0.50), // Power/s (kW)
    unlockAt: 0,
  },
  {
    id: 'powergrid',
    name: 'Power Grid',
    emoji: '🔌',
    description: 'Integrates local transformers. All Factory output ×1.5.',
    baseCost: D(75000),
    costGrowth: 1.12,
    baseRate: D(110.0),
    globalStageMult: 1.5,
    unlockAt: 0,
  },
  {
    id: 'automationhub',
    name: 'Automation Hub',
    emoji: '🤖',
    description: 'Advanced pneumatic arms run shifts without fatigue.',
    baseCost: D(500000),
    costGrowth: 1.13,
    baseRate: D(400.0),
    unlockAt: 1,
  },
  {
    id: 'megacore',
    name: 'Megafactory Core',
    emoji: '🏭',
    description: 'The industrial heart of the complex. All Factory production ×8.',
    baseCost: D(8e6),
    costGrowth: 1.15,
    baseRate: D(2000.0),
    globalStageMult: 8,
    unlockAt: 2,
  },
]

const factoryDef: StageDefinition = {
  id: 'factory',
  name: 'Factory',
  emoji: '🏭',
  theme: 'industrial manufacture',
  primaryCurrency: { id: 'widgets', name: 'Widgets', symbol: '⚙️', emoji: '⚙️' },
  secondaryCurrency: { id: 'power', name: 'Power', symbol: '⚡', emoji: '⚡' },
  prestigeCurrency: { id: 'patents', name: 'Patents', symbol: 'P', emoji: '📜' },
  generators,
  fortuneWeight: 1.6,
  prestigeSoftcap: D(1e9),
  prestigeK: 1,
  description:
    'Industrial assembly halls powered by coal and steam. Fed by Farm grain, the workers stamp out gears.',
  unlockCondition: 'Earn 5,000 lifetime Ore in the Mine.',
  color: '#c87f4a',
  bgColor: '#24140a',
}

export default factoryDef
