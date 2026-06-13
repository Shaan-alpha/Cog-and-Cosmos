/**
 * The Global Skill Tree — spent in Fortune (★), affects every stage.
 * Effects are recomputed deterministically from levels (see systems/skills.ts),
 * so the tree is fully save-safe and never drifts.
 *
 * effect:
 *   'global' → multiplies global production (gs.globalMult)
 *   'engine' → multiplies Fortune mint rate (gs.engine.engineMult)
 */
export type SkillEffect = 'global' | 'engine'

export interface SkillNode {
  id: string
  name: string
  icon: string
  description: string
  effect: SkillEffect
  effectPerLevel: number   // ×(1 + effectPerLevel · level)
  maxLevel: number
  baseCost: number         // ★ for the first level
  costGrowth: number       // cost × costGrowth^level
  requires: string[]       // node ids that must be ≥ level 1
  tier: number             // row in the tree
}

export const GLOBAL_SKILLS: SkillNode[] = [
  {
    id: 'spark', name: 'Spark of Fortune', icon: '✦', tier: 0,
    description: '+8% global production per level. The first turn of every cog.',
    effect: 'global', effectPerLevel: 0.08, maxLevel: 10, baseCost: 5, costGrowth: 1.5, requires: [],
  },
  {
    id: 'industry', name: 'Industry', icon: '🏗️', tier: 1,
    description: '+15% global production per level.',
    effect: 'global', effectPerLevel: 0.15, maxLevel: 8, baseCost: 50, costGrowth: 1.6, requires: ['spark'],
  },
  {
    id: 'enginetune', name: 'Engine Tuning', icon: '🔧', tier: 1,
    description: '+12% Fortune mint per level. Tighter cogs, faster gold.',
    effect: 'engine', effectPerLevel: 0.12, maxLevel: 8, baseCost: 40, costGrowth: 1.55, requires: ['spark'],
  },
  {
    id: 'abundance', name: 'Abundance', icon: '🌾', tier: 2,
    description: '+25% global production per level.',
    effect: 'global', effectPerLevel: 0.25, maxLevel: 6, baseCost: 500, costGrowth: 1.7, requires: ['industry'],
  },
  {
    id: 'synergy', name: 'Synergy', icon: '🔗', tier: 2,
    description: '+10% global production per level. Rewards a balanced engine.',
    effect: 'global', effectPerLevel: 0.10, maxLevel: 12, baseCost: 200, costGrowth: 1.5, requires: ['industry', 'enginetune'],
  },
  {
    id: 'overdrive', name: 'Overdrive', icon: '⚡', tier: 2,
    description: '+20% Fortune mint per level.',
    effect: 'engine', effectPerLevel: 0.20, maxLevel: 6, baseCost: 400, costGrowth: 1.7, requires: ['enginetune'],
  },
  {
    id: 'fortunefont', name: 'Fortune Font', icon: '⛲', tier: 3,
    description: '+30% Fortune mint per level. A wellspring of ★.',
    effect: 'engine', effectPerLevel: 0.30, maxLevel: 5, baseCost: 3000, costGrowth: 1.8, requires: ['overdrive'],
  },
  {
    id: 'dynasty', name: 'Dynasty', icon: '👑', tier: 3,
    description: '+40% global production per level.',
    effect: 'global', effectPerLevel: 0.40, maxLevel: 5, baseCost: 5000, costGrowth: 1.85, requires: ['abundance', 'synergy'],
  },
  {
    id: 'granddesign', name: 'The Grand Design', icon: '🌌', tier: 4,
    description: '+100% global production per level. The cosmos, by your hand.',
    effect: 'global', effectPerLevel: 1.0, maxLevel: 3, baseCost: 25000, costGrowth: 2.0, requires: ['dynasty', 'fortunefont'],
  },
]
