/**
 * The Challenge (Medal 🎖️) Tree — spent in Medals, earned by completing Challenges.
 * Reuses the global SkillNode shape and the same recompute path (systems/skills.ts),
 * so it is save-safe and persists through every prestige reset.
 */
import type { SkillNode } from './global'

export const CHALLENGE_SKILLS: SkillNode[] = [
  {
    id: 'ch:proven', name: 'Proven Mettle', icon: '🎖️', tier: 0,
    description: '+25% global production per level.',
    effect: 'global', effectPerLevel: 0.25, maxLevel: 5, baseCost: 2, costGrowth: 1.8, requires: [],
  },
  {
    id: 'ch:tempered', name: 'Tempered Edge', icon: '⚔️', tier: 1,
    description: '+25% Fortune mint per level.',
    effect: 'engine', effectPerLevel: 0.25, maxLevel: 5, baseCost: 3, costGrowth: 1.8, requires: ['ch:proven'],
  },
  {
    id: 'ch:relentless', name: 'Relentless', icon: '🔥', tier: 1,
    description: '+40% global production per level.',
    effect: 'global', effectPerLevel: 0.40, maxLevel: 3, baseCost: 4, costGrowth: 2.0, requires: ['ch:proven'],
  },
  {
    id: 'ch:crucible', name: 'The Crucible', icon: '🏆', tier: 2,
    description: '+100% global production. The trial-forged engine roars.',
    effect: 'global', effectPerLevel: 1.0, maxLevel: 1, baseCost: 8, costGrowth: 1.0, requires: ['ch:relentless'],
  },
]
