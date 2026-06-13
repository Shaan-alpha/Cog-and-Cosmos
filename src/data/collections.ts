export type RelicRarity = 'common' | 'uncommon' | 'rare' | 'legendary'

export interface Relic {
  id: string
  name: string
  icon: string
  rarity: RelicRarity
  effect: 'global' | 'engine'   // global production or ★ mint
  bonusPct: number
  description: string
  guaranteed?: boolean          // the deterministic centrepiece of its tier
}

export interface RelicSet {
  rarity: RelicRarity
  name: string
  effect: 'global' | 'engine'
  completionPct: number         // bonus for collecting every relic of this rarity
}

export const RELICS: Relic[] = [
  // ── Common (drops on stage prestige) ── +2% each
  { id: 'rl_brass_cog',   name: 'Brass Cog',     icon: '⚙️', rarity: 'common', effect: 'global', bonusPct: 2, guaranteed: true, description: 'The first tooth of the great machine.' },
  { id: 'rl_copper_coin', name: 'Copper Coin',   icon: '🪙', rarity: 'common', effect: 'global', bonusPct: 2, description: 'Worn smooth by a thousand hands.' },
  { id: 'rl_oil_can',     name: 'Oil Can',       icon: '🛢️', rarity: 'common', effect: 'engine', bonusPct: 2, description: 'Keeps the cogs turning sweet.' },
  { id: 'rl_worn_ledger', name: 'Worn Ledger',   icon: '📒', rarity: 'common', effect: 'global', bonusPct: 2, description: 'Every fortune begins as a tally.' },
  { id: 'rl_tin_lantern', name: 'Tin Lantern',   icon: '🏮', rarity: 'common', effect: 'global', bonusPct: 2, description: 'A small light against the ledger-dark.' },
  { id: 'rl_gear_tooth',  name: 'Gear Tooth',    icon: '🦷', rarity: 'common', effect: 'engine', bonusPct: 2, description: 'One tooth, faithfully meshing.' },

  // ── Uncommon (drops on ascension / challenge clear) ── +5% each
  { id: 'rl_legacy_seal',      name: 'Legacy Seal',      icon: '🔰', rarity: 'uncommon', effect: 'global', bonusPct: 5, guaranteed: true, description: 'Pressed into the wax of every inheritance.' },
  { id: 'rl_silver_gear',      name: 'Silver Gear',      icon: '🔩', rarity: 'uncommon', effect: 'global', bonusPct: 5, description: 'Finer than brass, and prouder.' },
  { id: 'rl_ancestral_key',    name: 'Ancestral Key',    icon: '🗝️', rarity: 'uncommon', effect: 'engine', bonusPct: 5, description: 'Opens doors your forebears sealed.' },
  { id: 'rl_heritage_map',     name: 'Heritage Map',     icon: '🗺️', rarity: 'uncommon', effect: 'global', bonusPct: 5, description: 'Charts the long road already walked.' },
  { id: 'rl_inheritance_ring', name: 'Inheritance Ring', icon: '💍', rarity: 'uncommon', effect: 'engine', bonusPct: 5, description: 'Passed down, never sold.' },

  // ── Rare (drops on transcendence) ── +12% each
  { id: 'rl_aether_prism', name: 'Aether Prism',    icon: '🔮', rarity: 'rare', effect: 'global', bonusPct: 12, guaranteed: true, description: 'Splits raw Aether into colour and force.' },
  { id: 'rl_void_shard',   name: 'Void Shard',      icon: '🌑', rarity: 'rare', effect: 'global', bonusPct: 12, description: 'A splinter of the space between.' },
  { id: 'rl_cosmic_lens',  name: 'Cosmic Lens',     icon: '🪞', rarity: 'rare', effect: 'engine', bonusPct: 12, description: 'Focuses the Mill on distant stars.' },
  { id: 'rl_star_ember',   name: 'Starforge Ember', icon: '🔥', rarity: 'rare', effect: 'global', bonusPct: 12, description: 'Still warm from a sun that has set.' },

  // ── Legendary (drops on Reality Reset) ── +25% each
  { id: 'rl_reality_core',  name: 'Reality Core',  icon: '💠', rarity: 'legendary', effect: 'global', bonusPct: 25, guaranteed: true, description: 'The seed a universe folds into.' },
  { id: 'rl_omega_sigil',   name: 'Omega Sigil',   icon: 'Ω',  rarity: 'legendary', effect: 'engine', bonusPct: 25, description: 'The last mark, after which nothing.' },
  { id: 'rl_infinity_loom', name: 'Infinity Loom', icon: '♾️', rarity: 'legendary', effect: 'global', bonusPct: 25, description: 'Weaves the thread that has no end.' },
]

export const RELIC_SETS: RelicSet[] = [
  { rarity: 'common',    name: 'Tinkerer’s Trove', effect: 'global', completionPct: 5 },
  { rarity: 'uncommon',  name: 'Ancestral Hoard',  effect: 'global', completionPct: 10 },
  { rarity: 'rare',      name: 'Cosmic Reliquary', effect: 'global', completionPct: 20 },
  { rarity: 'legendary', name: 'Apex Vault',       effect: 'global', completionPct: 40 },
]

export const RELIC_BY_ID: Record<string, Relic> = Object.fromEntries(RELICS.map(r => [r.id, r]))
