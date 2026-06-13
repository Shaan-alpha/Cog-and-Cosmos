import { D } from '../systems/Decimal'
import type { GameState } from './types'

export interface ChallengeRestriction {
  noAutoBuy?: boolean   // auto-buyers disabled during the run
  noBindings?: boolean  // cross-stage binding multipliers forced to 1
  prodMult?: number     // flat global production multiplier (e.g. 0.5)
  noPrestige?: boolean  // stage prestige disabled
}

export interface Challenge {
  id: string
  name: string
  icon: string
  description: string
  restriction: ChallengeRestriction
  goalLabel: string
  check: (gs: GameState) => boolean
  medalReward: number
  requires?: string[]
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'spartan_cogs', name: 'Spartan Cogs', icon: '🔧',
    description: 'Climb with no auto-buyers — every cog placed by hand.',
    restriction: { noAutoBuy: true },
    goalLabel: 'Reach 1e9 lifetime Coins',
    check: (gs) => (gs.stages.village?.primaryLifetime ?? D(0)).gte(D(1e9)),
    medalReward: 1,
  },
  {
    id: 'broken_chain', name: 'Broken Chain', icon: '⛓️',
    description: 'Cross-stage bindings are severed — no stage feeds another.',
    restriction: { noBindings: true },
    goalLabel: 'Unlock the Mine',
    check: (gs) => gs.stages.mine?.unlocked === true,
    medalReward: 2,
  },
  {
    id: 'half_measures', name: 'Half Measures', icon: '🌗',
    description: 'All production is halved.',
    restriction: { prodMult: 0.5 },
    goalLabel: 'Mint 100 ★ Fortune',
    check: (gs) => (gs.engine?.fortuneLifetime ?? D(0)).gte(D(100)),
    medalReward: 3,
  },
  {
    id: 'purist', name: 'Purist', icon: '🧘',
    description: 'No prestige, no auto-buyers — a pure manual climb.',
    restriction: { noPrestige: true, noAutoBuy: true },
    goalLabel: 'Reach 1e12 lifetime Coins',
    check: (gs) => (gs.stages.village?.primaryLifetime ?? D(0)).gte(D(1e12)),
    medalReward: 3,
    requires: ['spartan_cogs'],
  },
]

export const CHALLENGE_BY_ID: Record<string, Challenge> =
  Object.fromEntries(CHALLENGES.map(c => [c.id, c]))
