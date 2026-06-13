/**
 * The Transcendence (Aether) Meta Tree — spent in Aether (Æ), earned by Transcending the cosmos.
 * Reuses the global SkillNode shape and the same recompute path (systems/skills.ts),
 * so it's fully save-safe and never drifts.
 *
 * effect:
 *   'global' → multiplies global production (gs.globalMult)
 *   'engine' → multiplies Fortune mint rate (gs.engine.engineMult)
 */
import type { SkillNode } from './global'

export const TRANSCENDENCE_SKILLS: SkillNode[] = [
  {
    id: 'tr:wellspring', name: 'Aether Wellspring', icon: '⛲', tier: 0,
    description: '+50% global production per level. Survives Transcendence.',
    effect: 'global', effectPerLevel: 0.50, maxLevel: 5, baseCost: 3, costGrowth: 2.0, requires: [],
  },
  {
    id: 'tr:trans_multiplier', name: 'Transcend Multiplier', icon: '🜔', tier: 1,
    description: '+15% future Aether gain per level on Transcendence.',
    effect: 'global', effectPerLevel: 0, maxLevel: 5, baseCost: 6, costGrowth: 2.2, requires: ['tr:wellspring'],
  },
  {
    id: 'tr:start_boost', name: 'Start Boost', icon: '🚀', tier: 1,
    description: 'Start each run with 10^(2*level) of each unlocked stage\'s primary currency after resets.',
    effect: 'global', effectPerLevel: 0, maxLevel: 4, baseCost: 8, costGrowth: 2.5, requires: ['tr:wellspring'],
  },
  {
    id: 'tr:meta_automation', name: 'Meta Automation+', icon: '🤖', tier: 2,
    description: 'All autobuyers and Fortune Engine slots persist through Transcendence.',
    effect: 'global', effectPerLevel: 0, maxLevel: 1, baseCost: 12, costGrowth: 1.0, requires: ['tr:trans_multiplier'],
  },
]
