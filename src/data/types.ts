import type { Decimal } from '../systems/Decimal'

// ── Static definitions (loaded from data files) ───────────────────────────

export interface CurrencyDef {
  id: string
  name: string
  symbol: string
  emoji: string
}

export interface GeneratorDef {
  id: string
  name: string
  emoji: string
  description: string
  baseCost: Decimal
  costGrowth: number   // r in cost = base * r^count
  baseRate: Decimal       // primary currency / second
  secondaryRate?: Decimal // secondary currency / second (Wood, Water, …)
  laborOutput?: number // labor units/s (cross-stage binding)
  globalStageMult?: number // one-time mult applied to stage when ≥1 owned
  unlockAt: number     // prestige level required to purchase
}

export interface StageDefinition {
  id: string
  name: string
  emoji: string
  theme: string
  primaryCurrency: CurrencyDef
  secondaryCurrency: CurrencyDef
  prestigeCurrency: CurrencyDef
  generators: GeneratorDef[]
  fortuneWeight: number   // how much surplus from this stage is worth in ★
  prestigeSoftcap: Decimal
  prestigeK: number
  description: string
  unlockCondition: string
  color: string     // accent colour for UI
  bgColor: string   // panel background
}

// ── Runtime state (live game values) ─────────────────────────────────────

export interface GeneratorState {
  id: string
  count: number
  totalProduced: Decimal  // lifetime primary currency produced by this gen
}

export interface StageState {
  id: string
  primaryAmount: Decimal
  primaryLifetime: Decimal  // never resets; drives prestige gain
  secondaryAmount: Decimal
  prestigeCount: number     // how many times this stage has been prestiged
  prestigeCurrency: number  // e.g. Renown
  generators: Record<string, GeneratorState>
  laborOutput: Decimal      // total labor/s exported cross-stage
  productionMult: Decimal   // accumulated multipliers (skills, guildhalls, etc)
  lastTickMs: number
  unlocked: boolean
  autoBuy?: boolean         // auto-buyer toggle (unlocks once prestigeCount ≥ 1)
  ascensionCount?: number   // how many times this stage has been Ascended (deep meta reset → LP)
  autoBuyMode?: 'cheapest' | 'priority'
  autoBuyReserve?: number   // fraction 0.0 to 0.9 to reserve
  autoBuyMilestoneSnipe?: boolean
  autoBuyVault?: string[]   // list of vaulted generator IDs
}

export interface FortuneEngineState {
  fortune: Decimal         // ★ accumulated
  fortuneLifetime: Decimal
  slots: string[]          // stage IDs assigned to engine slots (max 8)
  engineMult: Decimal      // Fortune Engine multiplier from upgrades
}

export interface EnchantState {
  id: string            // 'quicken', 'greater_quicken', 'mass_enchant', 'overcharge'
  targetStageId: string // e.g. 'village' (or 'all' for mass_enchant)
  multiplier: Decimal   // effective multiplier
  durationLeft: number  // seconds left
  totalDuration: number // starting duration (for UI progress bar)
}

// Time stage — warp-tick state. Charges are spent to apply burst "offline-like"
// ticks to any chosen stage; they recharge slowly on a wall-clock cadence.
export interface WarpState {
  charges: number       // banked warp charges (cap derives from Chrono-Engines + skills)
  recharge: number      // seconds accumulated toward the next charge (0 → WARP_RECHARGE_SEC)
}

// Multiverse stage — duplication branch slots + the permanent Convergence multiplier.
// Each branch slot clones a chosen stage's output by dupPct (sustained by Echoes);
// Convergence "collapse" bakes a permanent global multiplier into convergenceMult.
export interface MultiverseState {
  branchSlots: string[]  // stage IDs currently being duplicated (length ≤ Branch Nodes + skills)
}

export interface GameState {
  version: number
  saveTimestamp: number    // unix ms, used for offline calculation
  stages: Record<string, StageState>
  engine: FortuneEngineState
  globalMult: Decimal      // derived from the Global + Ascension skill trees (recomputed, not authoritative)
  legacyPoints: number     // Legacy Points (LP) — minted by Ascension, spent on the Ascension meta tree
  skills: Record<string, number>  // Global + Local + Ascension skill trees: node id → level
  totalPlaytimeMs: number
  activeEnchants: EnchantState[]
  spaceBuffers: { ore: Decimal; power: Decimal }
  warp: WarpState
  multiverse: MultiverseState
  convergenceMult: Decimal  // permanent global ×mult baked by Convergence collapses (recomputed-safe: persisted, not derived)
  aether?: number           // Aether (Æ) pool — minted by Transcendence
  aetherLifetime?: number   // total Aether ever earned
  transcendCount?: number   // number of times transcended
  fortuneAllTime?: Decimal  // all-time ★ minted (survives resets, drives Æ gain)
  unlockedAchievements?: string[] // list of unlocked achievement IDs
  settings: {
    numberFormat: 'short' | 'scientific' | 'engineering'
    autoSaveInterval: number  // ms
    offlineProgress: boolean
    seenTutorials?: Record<string, boolean>
  }
}

