/**
 * Skill system — pure functions. The store owns mutation.
 * Global-tree effects are recomputed from levels so they never drift across saves.
 */
import { D, type Dec } from './Decimal'
import { GLOBAL_SKILLS, type SkillNode } from '../data/skills/global'
import { ASCENSION_SKILLS } from '../data/skills/ascension'
import { TRANSCENDENCE_SKILLS } from '../data/skills/transcendence'
import { OMEGA_SKILLS } from '../data/skills/omega'
import { CHALLENGE_SKILLS } from '../data/skills/challenge'
import { RELICS, RELIC_SETS } from '../data/collections'
import { ACHIEVEMENTS } from '../data/achievements'
import type { GameState } from '../data/types'

export const SKILL_BY_ID: Record<string, SkillNode> = Object.fromEntries(
  GLOBAL_SKILLS.map(n => [n.id, n]),
)

export const ASCENSION_BY_ID: Record<string, SkillNode> = Object.fromEntries(
  ASCENSION_SKILLS.map(n => [n.id, n]),
)

export const TRANSCEND_BY_ID: Record<string, SkillNode> = Object.fromEntries(
  TRANSCENDENCE_SKILLS.map(n => [n.id, n]),
)

export const OMEGA_BY_ID: Record<string, SkillNode> = Object.fromEntries(
  OMEGA_SKILLS.map(n => [n.id, n]),
)

export const CHALLENGE_SKILL_BY_ID: Record<string, SkillNode> = Object.fromEntries(
  CHALLENGE_SKILLS.map(n => [n.id, n]),
)

/** ★ cost to buy the next level of a node at the given current level. */
export function skillCost(node: SkillNode, level: number): Dec {
  return D(node.baseCost).mul(D(node.costGrowth).pow(level))
}

/** Are all prerequisite nodes at level ≥ 1? */
export function prereqsMet(node: SkillNode, skills: Record<string, number>): boolean {
  return node.requires.every(r => (skills[r] ?? 0) >= 1)
}

/**
 * Recompute derived multipliers from the purchased skill levels.
 * `global` factors fold into gs.globalMult; `engine` factors into gs.engine.engineMult.
 * Base of each product is 1, so zero skills → ×1 (no effect).
 */
export function recomputeUpgrades(gs: GameState): void {
  let global = 1
  let engine = 1
  // ★-spent Global, LP-spent Ascension, and Æ-spent Transcendence trees fold into the same
  // derived multipliers.
  for (const node of [...GLOBAL_SKILLS, ...ASCENSION_SKILLS, ...TRANSCENDENCE_SKILLS, ...OMEGA_SKILLS, ...CHALLENGE_SKILLS]) {
    const lvl = gs.skills[node.id] ?? 0
    if (lvl <= 0) continue
    const factor = 1 + node.effectPerLevel * lvl
    if (node.effect === 'global') global *= factor
    else engine *= factor
  }

  // Fold in Aether passive mill bonus: +5% Fortune mint per Aether
  const aetherBonus = 1 + 0.05 * (gs.aether ?? 0)

  // Fold in Omega passive bonus: +10% to BOTH global production and Fortune mint per Ω
  const omegaBonus = 1 + 0.10 * (gs.omega ?? 0)

  // Sum up unlocked achievements boosts: each grants its b_i % global production.
  const unlocked = gs.unlockedAchievements ?? []
  let achBoost = 0
  for (const ach of ACHIEVEMENTS) {
    if (unlocked.includes(ach.id)) {
      achBoost += ach.bonusPct
    }
  }
  const achMult = 1 + achBoost / 100

  // Fold in collected relics + completed rarity-set bonuses (Collections).
  const collected = new Set(gs.collectedRelics ?? [])
  let relicGlobalPct = 0, relicEnginePct = 0
  for (const r of RELICS) {
    if (!collected.has(r.id)) continue
    if (r.effect === 'global') relicGlobalPct += r.bonusPct
    else relicEnginePct += r.bonusPct
  }
  for (const s of RELIC_SETS) {
    const full = RELICS.filter(r => r.rarity === s.rarity).every(r => collected.has(r.id))
    if (full) { if (s.effect === 'global') relicGlobalPct += s.completionPct; else relicEnginePct += s.completionPct }
  }
  const relicGlobalMult = 1 + relicGlobalPct / 100
  const relicEngineMult = 1 + relicEnginePct / 100

  gs.globalMult = D(global * achMult * omegaBonus * relicGlobalMult)
  gs.engine.engineMult = D(engine * aetherBonus * omegaBonus * relicEngineMult)
}
