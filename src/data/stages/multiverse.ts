/**
 * Multiverse stage — Branching Realities (capstone)
 * Twist: Production Duplication + Convergence. Branch slots clone a chosen stage's
 * output by a % (sustained by Echoes). The endgame Convergence "collapse" bakes a
 * permanent global multiplier into every stage and grants Convergence (prestige).
 * Consumes Space Alloy (Rifts) and Time Paradox (Paradox Mirror) — closing the loop.
 * Numbers follow MASTER_PLAN §8.
 */
import { D } from '../../systems/Decimal'
import type { StageDefinition, GeneratorDef } from '../types'

const generators: GeneratorDef[] = [
  {
    id: 'rift',
    name: 'Rift',
    emoji: '🕳️',
    description: 'Tears a seam to a neighbouring reality. Consumes 2 Alloy/s to pull 1 Shard/s.',
    baseCost: D(5.0e5),
    costGrowth: 1.11,
    baseRate: D(1), // Shards/s
    unlockAt: 0,
  },
  {
    id: 'mirrorself',
    name: 'Mirror-Self',
    emoji: '🪞',
    description: 'A reflection of you, working in parallel. Produces 0.3 Echoes/s — the fuel for duplication.',
    baseCost: D(6.0e6),
    costGrowth: 1.12,
    baseRate: D(0),
    secondaryRate: D(0.3), // Echoes/s
    unlockAt: 0,
  },
  {
    id: 'branchnode',
    name: 'Branch Node',
    emoji: '🌿',
    description: 'Anchors a parallel branch. Each grants +1 duplication slot (5 Shards/s upkeep).',
    baseCost: D(9.0e7),
    costGrowth: 1.13,
    baseRate: D(0), // value is the duplication slot it grants (Multiverse branch)
    unlockAt: 0,
  },
  {
    id: 'paradoxmirror',
    name: 'Paradox Mirror',
    emoji: '🌀',
    description: "Turns Time's wasted Paradox into Shards. Consumes 1 Paradox/s to make 8 Shards/s.",
    baseCost: D(1.5e9),
    costGrowth: 1.14,
    baseRate: D(8), // Shards/s
    unlockAt: 1,
  },
  {
    id: 'realityloom',
    name: 'Reality Loom',
    emoji: '🧵',
    description: 'Weaves higher-fidelity copies. Produces 6 Echoes/s, widening every duplication.',
    baseCost: D(4.0e10),
    costGrowth: 1.145,
    baseRate: D(0),
    secondaryRate: D(6), // Echoes/s
    unlockAt: 2,
  },
  {
    id: 'convergencecore',
    name: 'Convergence Core',
    emoji: '💠',
    description: 'The capstone structure. Unlocks the Convergence collapse and grants all Multiverse output ×2.',
    baseCost: D(1.0e12),
    costGrowth: 1.15,
    baseRate: D(0),
    globalStageMult: 2,
    unlockAt: 3,
  },
]

const multiverseDef: StageDefinition = {
  id: 'multiverse',
  name: 'Multiverse',
  emoji: '🌌',
  theme: 'branching realities',
  primaryCurrency: { id: 'shards', name: 'Shards', symbol: '◈', emoji: '🔷' },
  secondaryCurrency: { id: 'echoes', name: 'Echoes', symbol: '〜', emoji: '🌫️' },
  prestigeCurrency: { id: 'convergence', name: 'Convergence', symbol: 'Ω', emoji: '🌟' },
  generators,
  fortuneWeight: 3.0,
  prestigeSoftcap: D(1e11),
  prestigeK: 4,
  description:
    'Every choice spawns a world. Clone any stage’s output through branch slots, then collapse the branches into one permanently-multiplied reality.',
  unlockCondition: 'Open all of stages 1–7, supply Alloy from Space, and ascend at least one stage.',
  color: '#d65a9e',
  bgColor: '#1a0c1a',
}

export default multiverseDef
