/**
 * Local Skill Trees — spent in each stage's prestige currency.
 * Namespace-prefixed IDs (e.g. 'magic:wellspring', 'space:ore_throughput')
 * to reside cleanly in the global GameState.skills record.
 */
export interface LocalSkillNode {
  id: string
  stageId: string
  name: string
  icon: string
  tier: number
  description: string
  effectPerLevel: number
  maxLevel: number
  baseCost: number
  costGrowth: number
  requires: string[]
}

export const LOCAL_SKILLS: LocalSkillNode[] = [
  // ── Magic Local Skills (Insight) ──
  {
    id: 'magic:wellspring', stageId: 'magic', name: 'Mana Wellspring', icon: '⛲', tier: 0,
    description: '+25% Mana/s per level.',
    effectPerLevel: 0.25, maxLevel: 5, baseCost: 2, costGrowth: 2.5, requires: [],
  },
  {
    id: 'magic:essence_flow', stageId: 'magic', name: 'Essence Flow', icon: '🧪', tier: 1,
    description: 'Ley Nodes and Astral Conduits output ×2.',
    effectPerLevel: 1.0, maxLevel: 1, baseCost: 8, costGrowth: 1.0, requires: ['magic:wellspring'],
  },
  {
    id: 'magic:enduring_glyphs', stageId: 'magic', name: 'Enduring Glyphs', icon: '📜', tier: 1,
    description: '+50% all Enchant durations.',
    effectPerLevel: 0.50, maxLevel: 1, baseCost: 15, costGrowth: 1.0, requires: ['magic:wellspring'],
  },
  {
    id: 'magic:backfire_ward', stageId: 'magic', name: 'Backfire Ward', icon: '🛡️', tier: 2,
    description: 'Overcharge backfire risk reduced 15% → 3%.',
    effectPerLevel: 0.80, maxLevel: 1, baseCost: 20, costGrowth: 1.0, requires: ['magic:enduring_glyphs'],
  },
  {
    id: 'magic:twin_casting', stageId: 'magic', name: 'Twin Casting', icon: '♊', tier: 2,
    description: '+1 simultaneous Enchant slot (limit 2 → 3).',
    effectPerLevel: 1.0, maxLevel: 1, baseCost: 40, costGrowth: 1.0, requires: ['magic:essence_flow', 'magic:enduring_glyphs'],
  },
  {
    id: 'magic:resonant_surplus', stageId: 'magic', name: 'Resonant Surplus', icon: '🌟', tier: 3,
    description: 'Mana surplus adds +30% weight to Fortune Engine siphoning.',
    effectPerLevel: 0.30, maxLevel: 1, baseCost: 60, costGrowth: 1.0, requires: ['magic:twin_casting'],
  },
  {
    id: 'magic:mana_battery', stageId: 'magic', name: 'Mana Battery', icon: '🔋', tier: 3,
    description: 'Retain 60% of Mana production during offline progress (vs 35%).',
    effectPerLevel: 0.60, maxLevel: 1, baseCost: 90, costGrowth: 1.0, requires: ['magic:twin_casting'],
  },

  // ── Space Local Skills (Telemetry) ──
  {
    id: 'space:ore_throughput', stageId: 'space', name: 'Ore Throughput', icon: '⛏️', tier: 0,
    description: 'Smelter and Refinery Ore demand −10% per level.',
    effectPerLevel: 0.10, maxLevel: 3, baseCost: 3, costGrowth: 2.8, requires: [],
  },
  {
    id: 'space:power_recapture', stageId: 'space', name: 'Power Recapture', icon: '⚡', tier: 1,
    description: 'Space generators Power demand −25%.',
    effectPerLevel: 0.25, maxLevel: 1, baseCost: 10, costGrowth: 1.0, requires: ['space:ore_throughput'],
  },
  {
    id: 'space:buffer_tanks', stageId: 'space', name: 'Buffer Tanks', icon: '🛢️', tier: 1,
    description: 'Siphons and stores up to 600s of Ore and Power to prevent starvation.',
    effectPerLevel: 1.0, maxLevel: 1, baseCost: 14, costGrowth: 1.0, requires: ['space:ore_throughput'],
  },
  {
    id: 'space:probe_swarm', stageId: 'space', name: 'Probe Swarm', icon: '🛰️', tier: 2,
    description: 'Probes generate +100% Stardust.',
    effectPerLevel: 1.0, maxLevel: 1, baseCost: 22, costGrowth: 1.0, requires: ['space:power_recapture'],
  },
  {
    id: 'space:logistics_ai', stageId: 'space', name: 'Logistics AI', icon: '🧠', tier: 2,
    description: 'Smelters, Refineries, and Dyson Frames Alloy output ×2.',
    effectPerLevel: 1.0, maxLevel: 1, baseCost: 35, costGrowth: 1.0, requires: ['space:buffer_tanks'],
  },
  {
    id: 'space:stellar_compression', stageId: 'space', name: 'Stellar Compression', icon: '✨', tier: 3,
    description: 'Stardust surplus adds +40% weight to Fortune Engine siphoning.',
    effectPerLevel: 0.40, maxLevel: 1, baseCost: 55, costGrowth: 1.0, requires: ['space:probe_swarm', 'space:logistics_ai'],
  },
  {
    id: 'space:self_mining_drones', stageId: 'space', name: 'Self-Mining Drones', icon: '🤖', tier: 3,
    description: 'Space generates 8% of its own Ore requirements internally (Ore demand −8%).',
    effectPerLevel: 0.08, maxLevel: 1, baseCost: 85, costGrowth: 1.0, requires: ['space:stellar_compression'],
  },

  // ── Time Local Skills (Epoch) ──
  {
    id: 'time:chronon_flow', stageId: 'time', name: 'Chronon Flow', icon: '⧖', tier: 0,
    description: '+30% Chronon/s per level.',
    effectPerLevel: 0.30, maxLevel: 4, baseCost: 3, costGrowth: 2.6, requires: [],
  },
  {
    id: 'time:paradox_vent', stageId: 'time', name: 'Paradox Vent', icon: '🌬️', tier: 1,
    description: 'Hourglass Array venting rate ×2.',
    effectPerLevel: 1.0, maxLevel: 1, baseCost: 12, costGrowth: 1.0, requires: ['time:chronon_flow'],
  },
  {
    id: 'time:stable_loop', stageId: 'time', name: 'Stable Loop', icon: '➿', tier: 1,
    description: 'Causal Loop Paradox leakage −50%.',
    effectPerLevel: 0.50, maxLevel: 1, baseCost: 18, costGrowth: 1.0, requires: ['time:chronon_flow'],
  },
  {
    id: 'time:deep_warp', stageId: 'time', name: 'Deep Warp', icon: '🕳️', tier: 2,
    description: 'Maximum warp duration per cast 300s → 900s.',
    effectPerLevel: 1.0, maxLevel: 1, baseCost: 30, costGrowth: 1.0, requires: ['time:paradox_vent', 'time:stable_loop'],
  },
  {
    id: 'time:echo_charges', stageId: 'time', name: 'Echo Charges', icon: '🔋', tier: 2,
    description: '+2 warp charge capacity.',
    effectPerLevel: 2.0, maxLevel: 1, baseCost: 45, costGrowth: 1.0, requires: ['time:stable_loop'],
  },
  {
    id: 'time:warp_mastery', stageId: 'time', name: 'Warp Mastery', icon: '🎯', tier: 3,
    description: 'Warp efficiency +25% (all warp ticks yield more).',
    effectPerLevel: 0.25, maxLevel: 1, baseCost: 90, costGrowth: 1.0, requires: ['time:deep_warp', 'time:echo_charges'],
  },

  // ── Multiverse Local Skills (Convergence) ──
  {
    id: 'multiverse:shard_flow', stageId: 'multiverse', name: 'Shard Flow', icon: '🔷', tier: 0,
    description: '+40% Shard/s per level.',
    effectPerLevel: 0.40, maxLevel: 3, baseCost: 4, costGrowth: 3.0, requires: [],
  },
  {
    id: 'multiverse:echo_reservoir', stageId: 'multiverse', name: 'Echo Reservoir', icon: '🪺', tier: 1,
    description: 'Duplication Echo upkeep −40% (sustain more clones).',
    effectPerLevel: 0.40, maxLevel: 1, baseCost: 10, costGrowth: 1.0, requires: ['multiverse:shard_flow'],
  },
  {
    id: 'multiverse:wider_branches', stageId: 'multiverse', name: 'Wider Branches', icon: '🌳', tier: 1,
    description: 'Base duplication 5% → 12%.',
    effectPerLevel: 0.07, maxLevel: 1, baseCost: 16, costGrowth: 1.0, requires: ['multiverse:shard_flow'],
  },
  {
    id: 'multiverse:extra_slot', stageId: 'multiverse', name: 'Extra Slot', icon: '➕', tier: 2,
    description: '+1 duplication slot (beyond Branch Nodes).',
    effectPerLevel: 1.0, maxLevel: 1, baseCost: 25, costGrowth: 1.0, requires: ['multiverse:wider_branches'],
  },
  {
    id: 'multiverse:paradox_harvest', stageId: 'multiverse', name: 'Paradox Harvest', icon: '🌀', tier: 2,
    description: 'Paradox Mirror Shard output ×2.5 (Time synergy).',
    effectPerLevel: 1.5, maxLevel: 1, baseCost: 35, costGrowth: 1.0, requires: ['multiverse:echo_reservoir'],
  },
  {
    id: 'multiverse:stable_convergence', stageId: 'multiverse', name: 'Stable Convergence', icon: '💠', tier: 3,
    description: 'Convergence collapse coefficient 0.10 → 0.14 (bigger permanent multipliers).',
    effectPerLevel: 0.04, maxLevel: 1, baseCost: 90, costGrowth: 1.0, requires: ['multiverse:extra_slot', 'multiverse:paradox_harvest'],
  },
]

export const LOCAL_SKILLS_BY_STAGE = LOCAL_SKILLS.reduce((acc, node) => {
  if (!acc[node.stageId]) acc[node.stageId] = []
  acc[node.stageId].push(node)
  return acc
}, {} as Record<string, LocalSkillNode[]>)

export const LOCAL_SKILL_BY_ID: Record<string, LocalSkillNode> = Object.fromEntries(
  LOCAL_SKILLS.map(n => [n.id, n])
)
