/**
 * SaveManager — IndexedDB primary, localStorage fallback.
 * Compression via lz-string. Versioned schema with migration.
 */
import { get as idbGet, set as idbSet } from 'idb-keyval'
import LZString from 'lz-string'
import type { GameState } from '../data/types'
import { D, Decimal } from './Decimal'

const SAVE_KEY = 'cog_cosmos_save'
const CURRENT_VERSION = 15
// Saves older than this predate the v5 economy rebalance (milestone ×8→×2, steeper
// cost growth). Their banked currency was earned on the old runaway curve, so they
// are intentionally discarded on load rather than migrated — a clean slate on the
// new pacing. `loadGame` surfaces this via `wasResetForRebalance`.
const RESET_BELOW_VERSION = 5

// ── Serialise Decimal values to strings for JSON ──────────────────────────

function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Decimal) return { __decimal__: value.toString() }
  return value
}

function reviver(_key: string, value: unknown): unknown {
  if (
    value !== null &&
    typeof value === 'object' &&
    '__decimal__' in (value as object)
  ) {
    return D((value as { __decimal__: string }).__decimal__)
  }
  return value
}

// ── Migration & Sanitisation ────────────────────────────────────────────────

const ZERO = D(0)

function ensureDecimal(val: any): Decimal {
  if (val instanceof Decimal) return val
  if (val && typeof val === 'object' && '__decimal__' in val) {
    return D(val.__decimal__)
  }
  if (val !== undefined && val !== null) {
    return D(val)
  }
  return ZERO
}

function sanitizeState(state: any): GameState {
  if (!state) return state

  state.globalMult = ensureDecimal(state.globalMult)

  if (state.stages) {
    for (const st of Object.values(state.stages) as any[]) {
      if (st) {
        st.primaryAmount = ensureDecimal(st.primaryAmount)
        st.primaryLifetime = ensureDecimal(st.primaryLifetime)
        st.secondaryAmount = ensureDecimal(st.secondaryAmount)
        st.laborOutput = ensureDecimal(st.laborOutput)
        st.productionMult = ensureDecimal(st.productionMult)

        if (st.generators) {
          for (const gen of Object.values(st.generators) as any[]) {
            if (gen) {
              gen.totalProduced = ensureDecimal(gen.totalProduced)
            }
          }
        }
      }
    }
  }

  if (state.engine) {
    state.engine.fortune = ensureDecimal(state.engine.fortune)
  }

  if (state.activeEnchants) {
    for (const enc of state.activeEnchants) {
      if (enc) {
        enc.multiplier = ensureDecimal(enc.multiplier)
      }
    }
  }

  if (state.spaceBuffers) {
    state.spaceBuffers.ore = ensureDecimal(state.spaceBuffers.ore)
    state.spaceBuffers.power = ensureDecimal(state.spaceBuffers.power)
  }

  // Convergence multiplier defaults to ×1 when absent — NEVER ZERO (that would null all production).
  state.convergenceMult = state.convergenceMult != null ? ensureDecimal(state.convergenceMult) : D(1)
  if (!state.multiverse) state.multiverse = { branchSlots: [] }

  state.fortuneAllTime = state.fortuneAllTime != null ? ensureDecimal(state.fortuneAllTime) : D(0)
  state.unlockedAchievements = state.unlockedAchievements || []

  return state
}

// Exported for unit testing the version-migration ladder. Pure: mutates and
// returns `raw`, no I/O. Production callers reach it via loadGame/importSave.
export function migrate(raw: GameState): GameState {
  // v1 → v2: introduce the Global skill tree.
  if (!raw.version || raw.version < 2) {
    raw.skills = raw.skills ?? {}
    raw.version = 2
  }
  // v2 → v3: settings seenTutorials
  if (raw.version < 3) {
    if (!raw.settings) {
      raw.settings = {
        numberFormat: 'short',
        juice: 'full',
        autoSaveInterval: 30_000,
        offlineProgress: true
      }
    }
    raw.settings.seenTutorials = raw.settings.seenTutorials ?? {}
    raw.version = 3
  }
  // v3 → v4: Magic & Space states (activeEnchants, spaceBuffers)
  if (raw.version < 4) {
    raw.activeEnchants = raw.activeEnchants ?? []
    raw.spaceBuffers = raw.spaceBuffers ?? { ore: D(0), power: D(0) }
    raw.version = 4
  }
  // v4 → v5 is a deliberate hard reset (economy rebalance), handled in loadGame —
  // not a field migration. Anything reaching here is already ≥ v5.
  // v5 → v6: Time stage + warp-charge state (additive — no reset).
  if (raw.version < 6) {
    if (!raw.warp) raw.warp = { charges: 2, recharge: 0 }
    raw.version = 6
  }
  // v6 → v7: Multiverse stage — branch slots + permanent Convergence multiplier (additive).
  if (raw.version < 7) {
    if (!raw.multiverse) raw.multiverse = { branchSlots: [] }
    if (raw.convergenceMult == null) raw.convergenceMult = D(1)
    raw.version = 7
  }
  // v7 → v8: Ascension meta layer — Legacy Points pool + per-stage ascension count (additive).
  if (raw.version < 8) {
    if (raw.legacyPoints == null) raw.legacyPoints = 0
    if (raw.stages) for (const st of Object.values(raw.stages) as any[]) {
      if (st && st.ascensionCount == null) st.ascensionCount = 0
    }
    raw.version = 8
  }
  // v8 → v9: Smart-Priority Auto-Buyer fields (additive).
  if (raw.version < 9) {
    if (raw.stages) {
      for (const st of Object.values(raw.stages) as any[]) {
        if (st) {
          if (st.autoBuyMode === undefined) st.autoBuyMode = 'cheapest'
          if (st.autoBuyReserve === undefined) st.autoBuyReserve = 0
          if (st.autoBuyMilestoneSnipe === undefined) st.autoBuyMilestoneSnipe = true
          if (st.autoBuyVault === undefined) st.autoBuyVault = []
        }
      }
    }
    raw.version = 9
  }
  // v9 → v10: Transcendence meta layer (Aether, transcendCount, aetherLifetime, fortuneAllTime)
  if (raw.version < 10) {
    if (raw.aether === undefined) raw.aether = 0
    if (raw.aetherLifetime === undefined) raw.aetherLifetime = 0
    if (raw.transcendCount === undefined) raw.transcendCount = 0
    if (raw.fortuneAllTime === undefined) raw.fortuneAllTime = D(0)
    raw.version = 10
  }
  // v10 → v11: Achievements system (unlockedAchievements list)
  if (raw.version < 11) {
    if (raw.unlockedAchievements === undefined) raw.unlockedAchievements = []
    raw.version = 11
  }
  // v11 → v12: Reality Reset meta layer (Omega pool, lifetime, count) — additive.
  if (raw.version < 12) {
    if (raw.omega === undefined) raw.omega = 0
    if (raw.omegaLifetime === undefined) raw.omegaLifetime = 0
    if (raw.omegaCount === undefined) raw.omegaCount = 0
    raw.version = 12
  }
  // v12 → v13: Challenges system (Medals, completed set, active-run marker) — additive.
  if (raw.version < 13) {
    if (raw.medals === undefined) raw.medals = 0
    if (raw.completedChallenges === undefined) raw.completedChallenges = []
    if (raw.activeChallenge === undefined) raw.activeChallenge = null
    raw.version = 13
  }
  // v13 → v14: Collections (relics) — additive.
  if (raw.version < 14) {
    if (raw.collectedRelics === undefined) raw.collectedRelics = []
    raw.version = 14
  }
  // v14 → v15: juice/game-feel intensity preference (additive). Defensive: seed a
  // settings object for any settings-less legacy save, then default juice to 'full'.
  if (raw.version < 15) {
    if (!raw.settings) raw.settings = { numberFormat: 'short', juice: 'full', autoSaveInterval: 30_000, offlineProgress: true } as GameState['settings']
    if ((raw.settings as { juice?: string }).juice === undefined) raw.settings.juice = 'full'
    raw.version = 15
  }
  raw.version = CURRENT_VERSION
  return sanitizeState(raw)
}

// Set when loadGame discards a pre-rebalance save, so the UI can explain the reset.
let wasResetForRebalance = false
export function consumeRebalanceReset(): boolean {
  const v = wasResetForRebalance
  wasResetForRebalance = false
  return v
}

// Set when loadGame finds a save blob it CANNOT read (corrupt/partial write). The raw
// blob is preserved under SAVE_KEY + '_corrupt_backup' so progress is never silently
// destroyed by the next autosave; the UI surfaces this so the player knows.
const CORRUPT_BACKUP_KEY = SAVE_KEY + '_corrupt_backup'
let wasLoadError = false
export function consumeLoadError(): boolean {
  const v = wasLoadError
  wasLoadError = false
  return v
}


// ── Public API ─────────────────────────────────────────────────────────────

export async function saveGame(state: GameState): Promise<void> {
  state.saveTimestamp = Date.now()
  const json = JSON.stringify(state, replacer)
  const compressed = LZString.compressToUTF16(json)
  try {
    await idbSet(SAVE_KEY, compressed)
  } catch {
    try { localStorage.setItem(SAVE_KEY, compressed) } catch { /* ignore */ }
  }
}

export async function loadGame(): Promise<GameState | null> {
  let compressed: string | null | undefined = null
  try {
    compressed = await idbGet<string>(SAVE_KEY)
  } catch { /* fall through to localStorage */ }
  if (!compressed) {
    try { compressed = localStorage.getItem(SAVE_KEY) } catch { /* ignore */ }
  }
  if (!compressed) return null
  try {
    const json = LZString.decompressFromUTF16(compressed)
    if (!json) throw new Error('decompression returned empty — blob is corrupt')
    const parsed = JSON.parse(json, reviver) as GameState
    // Pre-rebalance saves are intentionally wiped (see RESET_BELOW_VERSION). Returning
    // null makes initGame start a fresh game on the new curve.
    if (!parsed.version || parsed.version < RESET_BELOW_VERSION) {
      console.warn('[SaveManager] Save predates the v5 rebalance — starting fresh.')
      wasResetForRebalance = true
      return null
    }
    return migrate(parsed)
  } catch (e) {
    // A real save existed but couldn't be read. Preserve the raw blob so the imminent
    // fresh-game autosave can't silently destroy recoverable progress, and flag the UI.
    console.error('[SaveManager] Failed to parse save — preserving a backup copy:', e)
    wasLoadError = true
    try {
      await idbSet(CORRUPT_BACKUP_KEY, compressed)
    } catch {
      try { localStorage.setItem(CORRUPT_BACKUP_KEY, compressed) } catch { /* ignore */ }
    }
    return null
  }
}

/** Recover a previously-backed-up corrupt save blob (raw compressed string), if any. */
export async function getCorruptBackup(): Promise<string | null> {
  try {
    const v = await idbGet<string>(CORRUPT_BACKUP_KEY)
    if (v) return v
  } catch { /* fall through */ }
  try { return localStorage.getItem(CORRUPT_BACKUP_KEY) } catch { return null }
}

export function exportSave(state: GameState): string {
  state.saveTimestamp = Date.now()
  const json = JSON.stringify(state, replacer)
  return LZString.compressToBase64(json)
}

export function importSave(encoded: string): GameState | null {
  try {
    const json = LZString.decompressFromBase64(encoded)
    if (!json) return null
    const parsed = JSON.parse(json, reviver) as GameState
    return migrate(parsed)
  } catch (e) {
    console.error('[SaveManager] Import failed:', e)
    return null
  }
}
