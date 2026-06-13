import type { GameState } from './types'

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  hidden: boolean
  bonusPct: number // +X% global production
  check: (state: GameState) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'unlock_farm', name: 'Agrarian Roots', icon: '🌾', hidden: false, bonusPct: 1,
    description: 'Unlock the Farm stage.',
    check: (gs) => gs.stages.farm?.unlocked === true,
  },
  {
    id: 'unlock_mine', name: 'Deep Excavation', icon: '⛏️', hidden: false, bonusPct: 1,
    description: 'Unlock the Mine stage.',
    check: (gs) => gs.stages.mine?.unlocked === true,
  },
  {
    id: 'unlock_factory', name: 'Automation Era', icon: '🏭', hidden: false, bonusPct: 1,
    description: 'Unlock the Factory stage.',
    check: (gs) => gs.stages.factory?.unlocked === true,
  },
  {
    id: 'unlock_magic', name: 'Arcane Spark', icon: '🔮', hidden: false, bonusPct: 1,
    description: 'Unlock the Magic stage.',
    check: (gs) => gs.stages.magic?.unlocked === true,
  },
  {
    id: 'unlock_space', name: 'Star Bound', icon: '🚀', hidden: false, bonusPct: 1,
    description: 'Unlock the Space stage.',
    check: (gs) => gs.stages.space?.unlocked === true,
  },
  {
    id: 'unlock_time', name: 'Temporal Rift', icon: '⏳', hidden: false, bonusPct: 1,
    description: 'Unlock the Time stage.',
    check: (gs) => gs.stages.time?.unlocked === true,
  },
  {
    id: 'unlock_multiverse', name: 'Omniverse Link', icon: '🌌', hidden: false, bonusPct: 1,
    description: 'Unlock the Multiverse stage.',
    check: (gs) => gs.stages.multiverse?.unlocked === true,
  },
  {
    id: 'first_prestige', name: 'The Cycle Begins', icon: '🔄', hidden: false, bonusPct: 1,
    description: 'Prestige any stage at least once.',
    check: (gs) => Object.values(gs.stages).some(st => (st.prestigeCount ?? 0) >= 1),
  },
  {
    id: 'first_ascension', name: 'Ascended Mind', icon: '🜲', hidden: false, bonusPct: 1,
    description: 'Ascend any stage at least once to earn Legacy Points.',
    check: (gs) => Object.values(gs.stages).some(st => (st.ascensionCount ?? 0) >= 1),
  },
  {
    id: 'first_transcend', name: 'Cosmic Awakening', icon: '🜔', hidden: false, bonusPct: 1,
    description: 'Transcend the Cosmos at least once to earn Aether.',
    check: (gs) => (gs.transcendCount ?? 0) >= 1,
  },
  {
    id: 'fortune_1k', name: 'Gatherer of Gold', icon: '★', hidden: false, bonusPct: 1,
    description: 'Accumulate 1,000 ★ Fortune.',
    check: (gs) => gs.engine.fortune.gte(1000),
  },
  {
    id: 'fortune_100k', name: 'Vault of Stars', icon: '✨', hidden: false, bonusPct: 1,
    description: 'Accumulate 100,000 ★ Fortune.',
    check: (gs) => gs.engine.fortune.gte(100000),
  },
  {
    id: 'fortune_1e9', name: 'Astral Billionaire', icon: '👑', hidden: false, bonusPct: 1,
    description: 'Accumulate 1,000,000,000 ★ Fortune.',
    check: (gs) => gs.engine.fortune.gte(1e9),
  },
  {
    id: 'clocktower_5', name: 'Grand Chronologist', icon: '🕰️', hidden: false, bonusPct: 1,
    description: 'Own at least 5 Clocktowers in the Time stage.',
    check: (gs) => (gs.stages.time?.generators.clocktower?.count ?? 0) >= 5,
  },
  {
    id: 'convergence_1', name: 'Stable Realities', icon: '🌀', hidden: false, bonusPct: 1,
    description: 'Collapse the multiverse branches (Convergence) at least once.',
    check: (gs) => (gs.convergenceMult?.gt(1) ?? false),
  },
  {
    id: 'autobuy_3', name: 'Self-Running Engine', icon: '🤖', hidden: false, bonusPct: 1,
    description: 'Have auto-buy toggled active on at least 3 stages simultaneously.',
    check: (gs) => Object.values(gs.stages).filter(st => st.autoBuy).length >= 3,
  },
  {
    id: 'buy_aether_skill', name: 'Aether Scholar', icon: '⛲', hidden: false, bonusPct: 1,
    description: 'Purchase at least one upgrade from the Aether Tree.',
    check: (gs) => Object.entries(gs.skills).some(([k, v]) => k.startsWith('tr:') && v >= 1),
  },
  {
    id: 'full_engine', name: 'Cosmic Symphony', icon: '☸️', hidden: true, bonusPct: 2,
    description: 'Wire all 8 stages into the Fortune Engine simultaneously.',
    check: (gs) => gs.engine.slots.filter(Boolean).length >= 8,
  },
  {
    id: 'paradox_200', name: 'Temporal Paradox', icon: '☣️', hidden: true, bonusPct: 2,
    description: 'Reach 200 Paradox in the Time stage.',
    check: (gs) => (gs.stages.time?.secondaryAmount?.toNumber() ?? 0) >= 200,
  },
  {
    id: 'duplication_active', name: 'Echo Chambers', icon: '👥', hidden: true, bonusPct: 2,
    description: 'Duplicate a stage using a Multiverse duplication slot.',
    check: (gs) => (gs.multiverse?.branchSlots.some(Boolean) ?? false),
  },
]
