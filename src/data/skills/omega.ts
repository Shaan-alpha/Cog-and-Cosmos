/**
 * The Reality (Omega Ω) Meta Tree — spent in Omega (Ω), earned by performing a
 * Reality Reset. Reuses the global SkillNode shape and the same recompute path
 * (systems/skills.ts), so it is fully save-safe and never drifts.
 *
 * effect:
 *   'global' → multiplies global production (gs.globalMult)
 *   'engine' → multiplies Fortune mint rate (gs.engine.engineMult)
 *
 * om:reality_multiplier and om:eternal_engine carry effectPerLevel 0 — their
 * effects are read explicitly in omegaPreview()/realityReset(), exactly like the
 * Aether tree's tr:trans_multiplier / tr:meta_automation.
 */
import type { SkillNode } from './global'

export const OMEGA_SKILLS: SkillNode[] = [
  {
    id: 'om:foundation', name: 'Reality Foundation', icon: '🌑', tier: 0,
    description: '+50% global production per level. Survives the Reality Reset.',
    effect: 'global', effectPerLevel: 0.50, maxLevel: 5, baseCost: 3, costGrowth: 2.0, requires: [],
  },
  {
    id: 'om:reality_multiplier', name: 'Reality Multiplier', icon: 'Ω', tier: 1,
    description: '+15% future Omega (Ω) gain per level on Reality Reset.',
    effect: 'global', effectPerLevel: 0, maxLevel: 5, baseCost: 6, costGrowth: 2.2, requires: ['om:foundation'],
  },
  {
    id: 'om:mint_resonance', name: 'Mint Resonance', icon: '💠', tier: 1,
    description: '+50% Fortune mint per level.',
    effect: 'engine', effectPerLevel: 0.50, maxLevel: 5, baseCost: 6, costGrowth: 2.2, requires: ['om:foundation'],
  },
  {
    id: 'om:eternal_engine', name: 'Eternal Engine', icon: '♾️', tier: 2,
    description: 'All autobuyers and Fortune Engine slots persist through the Reality Reset.',
    effect: 'global', effectPerLevel: 0, maxLevel: 1, baseCost: 12, costGrowth: 1.0, requires: ['om:reality_multiplier'],
  },
]
