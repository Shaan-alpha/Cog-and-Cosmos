/**
 * Magic stage — Arcane Sanctum
 * Twist: Temporary Enchantments. Mana is burned to cast enchants that boost other stages.
 * Upkeep: Familiars consume Farm grain and Magic essence.
 * Numbers follow MASTER_PLAN §17 baselines.
 */
import { D } from '../../systems/Decimal'
import type { StageDefinition, GeneratorDef } from '../types'

const generators: GeneratorDef[] = [
  {
    id: 'sigil',
    name: 'Sigil',
    emoji: '🌀',
    description: 'Etch simple glyphs. The foundation of arcane flow.',
    baseCost: D(50),
    costGrowth: 1.09,
    baseRate: D(0.5),   // Mana/s
    unlockAt: 0,
  },
  {
    id: 'familiar',
    name: 'Familiar',
    emoji: '🦉',
    description: 'Summon mystical beasts. Produces Mana, but consumes 0.05 Grain/s and 0.1 Essence/s upkeep.',
    baseCost: D(600),
    costGrowth: 1.10,
    baseRate: D(4.0),   // Mana/s
    unlockAt: 0,
  },
  {
    id: 'leynode',
    name: 'Ley Node',
    emoji: '💎',
    description: 'Tap local magical currents to harvest raw Essence.',
    baseCost: D(9000),
    costGrowth: 1.11,
    baseRate: D(0),
    secondaryRate: D(0.8), // Essence/s
    unlockAt: 0,
  },
  {
    id: 'runesmith',
    name: 'Runesmith',
    emoji: '🔨',
    description: 'Carves runes to sustain magic. +2% Enchant duration per 25 owned.',
    baseCost: D(1.4e5),
    costGrowth: 1.12,
    baseRate: D(22.0),  // Mana/s
    unlockAt: 0,
  },
  {
    id: 'archmage',
    name: 'Archmage',
    emoji: '🧙',
    description: 'Masters of the arcane. All Magic output ×1.5. Unlocks 3rd Enchant slot at 50 owned.',
    baseCost: D(3.1e6),
    costGrowth: 1.13,
    baseRate: D(180.0), // Mana/s
    globalStageMult: 1.5,
    unlockAt: 0,
  },
  {
    id: 'astralconduit',
    name: 'Astral Conduit',
    emoji: '🌌',
    description: 'Channels star energy into Essence. Count raises the Enchant potency cap.',
    baseCost: D(8e7),
    costGrowth: 1.135,
    baseRate: D(0),
    secondaryRate: D(6.0), // Essence/s
    unlockAt: 1,
  },
  {
    id: 'arcanecitadel',
    name: 'Arcane Citadel',
    emoji: '🏰',
    description: 'A bastion of absolute wizardry. All Magic production ×8.',
    baseCost: D(6e8),
    costGrowth: 1.15,
    baseRate: D(1500.0), // Mana/s
    globalStageMult: 8,
    unlockAt: 2,
  },
]

const magicDef: StageDefinition = {
  id: 'magic',
  name: 'Magic',
  emoji: '🔮',
  theme: 'arcane sanctum',
  primaryCurrency: { id: 'mana', name: 'Mana', symbol: '🔮', emoji: '🔮' },
  secondaryCurrency: { id: 'essence', name: 'Essence', symbol: '🧪', emoji: '🧪' },
  prestigeCurrency: { id: 'insight', name: 'Insight', symbol: 'I', emoji: '👁️' },
  generators,
  fortuneWeight: 1.75,
  prestigeSoftcap: D(1e6), // softcap C
  prestigeK: 12,           // prestige multiplier
  description:
    'Mana pools shimmering in purple light. Burn Mana to cast powerful enchants across your entire empire.',
  unlockCondition: 'Earn 1,000,000 lifetime Widgets in the Factory.',
  color: '#b463d6',
  bgColor: '#1c1224',
}

export default magicDef
