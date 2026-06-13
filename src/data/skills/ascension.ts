/**
 * The Ascension Meta Tree — spent in Legacy Points (LP), earned by Ascending stages.
 * Reuses the global SkillNode shape and the same recompute path (systems/skills.ts),
 * so it's fully save-safe and never drifts. Nodes fold into gs.globalMult / engineMult
 * exactly like the ★ tree — LP is simply a rarer, deeper currency, so the bonuses are larger.
 *
 * effect:
 *   'global' → multiplies global production (gs.globalMult)
 *   'engine' → multiplies Fortune mint rate (gs.engine.engineMult)
 */
import type { SkillNode } from './global'

export const ASCENSION_SKILLS: SkillNode[] = [
  {
    id: 'asc:legacy', name: 'Legacy', icon: '🜲', tier: 0,
    description: '+20% global production per level. The weight of every life lived before.',
    effect: 'global', effectPerLevel: 0.20, maxLevel: 10, baseCost: 1, costGrowth: 1.6, requires: [],
  },
  {
    id: 'asc:inheritance', name: 'Inheritance', icon: '📜', tier: 1,
    description: '+35% global production per level.',
    effect: 'global', effectPerLevel: 0.35, maxLevel: 8, baseCost: 8, costGrowth: 1.7, requires: ['asc:legacy'],
  },
  {
    id: 'asc:ancestral_engine', name: 'Ancestral Engine', icon: '⚙️', tier: 1,
    description: '+30% Fortune mint per level. Old cogs turn the new.',
    effect: 'engine', effectPerLevel: 0.30, maxLevel: 8, baseCost: 8, costGrowth: 1.7, requires: ['asc:legacy'],
  },
  {
    id: 'asc:eternal_return', name: 'Eternal Return', icon: '♾️', tier: 2,
    description: '+50% global production per level.',
    effect: 'global', effectPerLevel: 0.50, maxLevel: 6, baseCost: 40, costGrowth: 1.8, requires: ['asc:inheritance'],
  },
  {
    id: 'asc:mint_dynasty', name: 'Mint Dynasty', icon: '👑', tier: 2,
    description: '+60% Fortune mint per level.',
    effect: 'engine', effectPerLevel: 0.60, maxLevel: 5, baseCost: 50, costGrowth: 1.85, requires: ['asc:ancestral_engine'],
  },
  {
    id: 'asc:apotheosis', name: 'Apotheosis', icon: '🌟', tier: 3,
    description: '+150% global production per level. The self, made cosmos.',
    effect: 'global', effectPerLevel: 1.5, maxLevel: 3, baseCost: 250, costGrowth: 2.0, requires: ['asc:eternal_return', 'asc:mint_dynasty'],
  },
]
