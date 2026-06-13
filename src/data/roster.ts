/**
 * Display roster of all 8 stages — used by the dial bar to tease the full journey
 * even before stages are built/unlocked. Dials unlock sequentially as the player
 * progresses through the interdependent loop.
 */
export interface StageRosterEntry {
  id: string
  name: string
  emoji: string
  color: string
  /** short teaser shown on the locked dial's tooltip */
  teaser: string
}

export const STAGE_ROSTER: StageRosterEntry[] = [
  { id: 'village',    name: 'Village',    emoji: '🏡', color: '#7fae6b', teaser: 'Coins & Labor' },
  { id: 'farm',       name: 'Farm',       emoji: '🌾', color: '#e0b84a', teaser: 'Grain feeds the workers' },
  { id: 'mine',       name: 'Mine',       emoji: '⛏️', color: '#9b7fd4', teaser: 'Ore & Gems from the deep' },
  { id: 'factory',    name: 'Factory',    emoji: '🏭', color: '#c87f4a', teaser: 'Widgets & Power' },
  { id: 'magic',      name: 'Magic',      emoji: '🔮', color: '#b463d6', teaser: 'Mana enchants any stage' },
  { id: 'space',      name: 'Space',      emoji: '🚀', color: '#4ec0d4', teaser: 'Stardust & Alloy' },
  { id: 'time',       name: 'Time',       emoji: '⏳', color: '#e6a93f', teaser: 'Chronons warp time' },
  { id: 'multiverse', name: 'Multiverse', emoji: '🌌', color: '#d65a9e', teaser: 'Shards duplicate worlds' },
]
