/**
 * Central reactive game store using Svelte 5 runes.
 * The game loop ticks here; UI components subscribe via $state / $derived.
 */
import { StageEconomy } from '../systems/StageEconomy'
import { FortuneEngine } from '../systems/FortuneEngine'
import { saveGame, loadGame, exportSave, importSave, consumeRebalanceReset, consumeLoadError } from '../systems/SaveManager'
import { isCloudConfigured, currentUser, fetchCloudMeta, pushSave, pullSave } from '../systems/cloud'
import type { CloudMeta } from '../systems/cloud'
import { offlineGain, omegaGain } from '../systems/formulas'
import { recomputeUpgrades, skillCost, prereqsMet, SKILL_BY_ID, ASCENSION_BY_ID, TRANSCEND_BY_ID, OMEGA_BY_ID, CHALLENGE_SKILL_BY_ID } from '../systems/skills'
import { GLOBAL_SKILLS } from '../data/skills/global'
import { ASCENSION_SKILLS } from '../data/skills/ascension'
import { TRANSCENDENCE_SKILLS } from '../data/skills/transcendence'
import { OMEGA_SKILLS } from '../data/skills/omega'
import { CHALLENGE_SKILLS } from '../data/skills/challenge'
import { CHALLENGES, CHALLENGE_BY_ID, type ChallengeRestriction } from '../data/challenges'
import { RELICS, RELIC_BY_ID, type RelicRarity } from '../data/collections'
import { EVENTS, EVENT_BY_ID } from '../data/events'
import { ACHIEVEMENTS } from '../data/achievements'
import { playTranscend } from '../systems/audio'
import { defaultJuiceLevel, setJuice } from '../systems/juice'
import { shake } from './effects.svelte'
import { D, ONE, ZERO, fmt as baseFmt, type Dec } from '../systems/Decimal'
import type { GameState, StageState } from '../data/types'
import villageDef from '../data/stages/village'
import farmDef from '../data/stages/farm'
import mineDef from '../data/stages/mine'
import factoryDef from '../data/stages/factory'
import magicDef from '../data/stages/magic'
import spaceDef from '../data/stages/space'
import timeDef from '../data/stages/time'
import multiverseDef from '../data/stages/multiverse'
import { LOCAL_SKILL_BY_ID } from '../data/skills/local'

// ── Stage registry ─────────────────────────────────────────────────────────
const STAGE_DEFS = {
  village: villageDef,
  farm: farmDef,
  mine: mineDef,
  factory: factoryDef,
  magic: magicDef,
  space: spaceDef,
  time: timeDef,
  multiverse: multiverseDef,
}
const STAGE_ECONOMIES: Record<string, StageEconomy> = {
  village: new StageEconomy(villageDef),
  farm: new StageEconomy(farmDef),
  mine: new StageEconomy(mineDef),
  factory: new StageEconomy(factoryDef),
  magic: new StageEconomy(magicDef),
  space: new StageEconomy(spaceDef),
  time: new StageEconomy(timeDef),
  multiverse: new StageEconomy(multiverseDef),
}

// ── Warp (Time stage) constants ──────────────────────────────────────────────
const WARP_RECHARGE_SEC = 300          // one warp charge regenerates every 5 minutes
const WARP_BASE_CHARGE_CAP = 2         // before Chrono-Engines / Echo Charges
const WARP_BASE_MAX_T = 300            // seconds of game-time per cast (900 with Deep Warp)
const fortuneEngine = new FortuneEngine()


// ── Fresh game state ────────────────────────────────────────────────────────
function freshGameState(): GameState {
  const state: GameState = {
    version: 10,
    saveTimestamp: Date.now(),
    stages: {
      village: STAGE_ECONOMIES.village.freshState(),
      farm: STAGE_ECONOMIES.farm.freshState(),
      mine: STAGE_ECONOMIES.mine.freshState(),
      factory: STAGE_ECONOMIES.factory.freshState(),
      magic: STAGE_ECONOMIES.magic.freshState(),
      space: STAGE_ECONOMIES.space.freshState(),
      time: STAGE_ECONOMIES.time.freshState(),
      multiverse: STAGE_ECONOMIES.multiverse.freshState(),
    },
    engine: fortuneEngine.freshState(),
    globalMult: ONE,
    legacyPoints: 0,
    skills: {},
    activeEnchants: [],
    spaceBuffers: { ore: ZERO, power: ZERO },
    warp: { charges: WARP_BASE_CHARGE_CAP, recharge: 0 },
    multiverse: { branchSlots: [] },
    convergenceMult: ONE,
    totalPlaytimeMs: 0,
    aether: 0,
    aetherLifetime: 0,
    transcendCount: 0,
    fortuneAllTime: ZERO,
    omega: 0,
    omegaLifetime: 0,
    omegaCount: 0,
    medals: 0,
    completedChallenges: [],
    activeChallenge: null,
    collectedRelics: [],
    settings: {
      numberFormat: 'short',
      juice: defaultJuiceLevel(),
      autoSaveInterval: 30_000,
      offlineProgress: true,
      seenTutorials: {},
    },
  }
  // Seed a few starting Coins so the very first Cottage is affordable immediately —
  // no clicking wall on a brand-new game. (The manual gather handles from-zero cases.)
  state.stages.village.primaryAmount = D(15)
  return state
}

// ── Reactive state ──────────────────────────────────────────────────────────
// Svelte 5: $state makes these deeply reactive
let gs = $state<GameState>(freshGameState())
let lastSaveMs = Date.now()
let lastFrameMs = Date.now()
let animFrameId = 0
let initialized = $state(false)

// Accessor functions — Svelte 5 forbids exporting raw $derived from .svelte.ts modules.
// Components call these inside $derived(...) blocks for reactivity.
export function village() { return gs.stages.village }
export function engine()  { return gs.engine }
export function fortune() { return gs.engine.fortune }
export function stageState(id: string) { return gs.stages[id] }
export function aether() { return gs.aether ?? 0 }
export function aetherLifetime() { return gs.aetherLifetime ?? 0 }
export function omega() { return gs.omega ?? 0 }
export function omegaLifetime() { return gs.omegaLifetime ?? 0 }
export function omegaCount() { return gs.omegaCount ?? 0 }
export function medals() { return gs.medals ?? 0 }
export function completedChallenges() { return gs.completedChallenges ?? [] }
export function activeChallenge() { return gs.activeChallenge ?? null }
export function anyStageAscended() { return Object.values(gs.stages).some(s => (s.ascensionCount ?? 0) >= 1) }

/** The restriction of the active challenge for a given state (null when not in a challenge). */
function restrictionFor(state: GameState): ChallengeRestriction | null {
  const id = state.activeChallenge
  return id ? (CHALLENGE_BY_ID[id]?.restriction ?? null) : null
}
export function activeChallengeRestriction(): ChallengeRestriction | null { return restrictionFor(gs) }

// ── Collections (relics) ─────────────────────────────────────────────────────
export function collectedRelics() { return gs.collectedRelics ?? [] }
export function relicStats() {
  const collected = (gs.collectedRelics ?? []).length
  return { collected, total: RELICS.length }
}

// Per-event drop chances (tunable). Guaranteed centrepieces ignore chance.
const RELIC_DROP: Record<RelicRarity, number> = { common: 0.5, uncommon: 0.6, rare: 1.0, legendary: 1.0 }

function grantRelic(id: string): boolean {
  if (!gs.collectedRelics) gs.collectedRelics = []
  if (gs.collectedRelics.includes(id)) return false
  gs.collectedRelics.push(id)
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  pushToast(`🏺 Relic found: ${RELIC_BY_ID[id]?.name ?? id}`)
  return true
}

/** Roll a relic drop of `rarity`: the guaranteed centrepiece first (deterministic), then a random uncollected one. */
function grantDrop(rarity: RelicRarity, chance: number): boolean {
  const owned = new Set(gs.collectedRelics ?? [])
  const guaranteed = RELICS.find(r => r.rarity === rarity && r.guaranteed && !owned.has(r.id))
  if (guaranteed) return grantRelic(guaranteed.id)
  if (Math.random() < chance) {
    const pool = RELICS.filter(r => r.rarity === rarity && !owned.has(r.id))
    if (pool.length) return grantRelic(pool[Math.floor(Math.random() * pool.length)].id)
  }
  return false
}
export function transcendCount() { return gs.transcendCount ?? 0 }
export function fortuneAllTime() { return gs.fortuneAllTime ?? ZERO }

// ── Cross-stage bindings ────────────────────────────────────────────────────
// Data-driven so adding a stage's synergy is one entry. Each rule reads a source
// quantity from another stage and turns it into a production multiplier that
// COMPOUNDS with the others on the target stage.
export interface BindingView { label: string; detail: string; mult: Dec; color: string; icon: string }

interface BindingRule {
  label: string
  icon: string
  color: string
  read: (stages: Record<string, StageState>) => Dec
  detail: (v: Dec) => string
  mult: (v: Dec) => Dec
}

// Village Townsfolk LABOR: 1/s → ×2, 4 → ×3, 100 → ×11  (√ growth)
const LABOR_RULE: BindingRule = {
  label: 'Village Labor', icon: '⚒', color: 'var(--village)',
  read: s => s.village?.laborOutput ?? ZERO,
  detail: v => `${fmt(v)} labor/s`,
  mult: v => ONE.add(v.sqrt()),
}
// Farm GRAIN stockpile feeds the miners: log-scaled so it never runs away.
const GRAIN_RULE: BindingRule = {
  label: 'Farm Grain', icon: '🌾', color: 'var(--farm)',
  read: s => s.farm?.primaryAmount ?? ZERO,
  detail: v => `${fmt(v)} grain`,
  mult: v => ONE.add(v.add(ONE).log10().mul(0.5)),
}

const STAGE_BINDINGS: Record<string, BindingRule[]> = {
  farm: [LABOR_RULE],
  mine: [LABOR_RULE, GRAIN_RULE],
  factory: [GRAIN_RULE],
}

// Per-frame memo of binding multipliers for the LIVE state. `bindingStamp` bumps once
// per sim step (invalidating every entry), so repeated UI reads (stageRates/bindingInfos)
// in one render frame don't recompute sqrt()/log10() Decimals. The sim loop itself passes
// useCache=false because it ticks Village→Farm in-order and must see fresh Labor mid-step.
let bindingStamp = 0
const bindingCache: Record<string, { stamp: number; val: Dec }> = {}
// Echo-sustain ratio for Multiverse duplication, refreshed each sim step (0–1). Drives how
// much of each slot's dupPct is actually delivered when Echoes can't cover full upkeep.
let mvEchoSustain = 1

function bindingMultFor(
  stageId: string,
  stages: Record<string, StageState> = gs.stages,
  useCache = true,
): Dec {
  const rules = STAGE_BINDINGS[stageId]
  const live = stages === gs.stages
  if (live && activeChallengeRestriction()?.noBindings) return ONE   // challenge: bindings severed
  // Multiverse duplication is a LIVE-only broadcast (offline approximates without it).
  const dup = live ? duplicationMultFor(stageId) : ONE
  if (!rules) return dup
  if (useCache && live) {
    const c = bindingCache[stageId]
    if (c && c.stamp === bindingStamp) return c.val
  }
  let m = dup
  for (const r of rules) m = m.mul(r.mult(r.read(stages)))
  if (useCache && live) bindingCache[stageId] = { stamp: bindingStamp, val: m }
  return m
}

// ── Multiverse duplication (broadcast: clone a stage's output by dupPct) ─────
/** Per-slot duplication percentage from Mirror-Selves + Reality Looms (cap 100%). */
export function dupPct(): number {
  const mv = gs.stages.multiverse
  if (!mv) return 0
  const base = (gs.skills['multiverse:wider_branches'] ?? 0) >= 1 ? 0.12 : 0.05
  const mirror = mv.generators.mirrorself?.count ?? 0
  const loom = mv.generators.realityloom?.count ?? 0
  return Math.min(1, base + 0.005 * mirror + 0.01 * loom)
}

/** How many duplication slots exist: one per Branch Node + the Extra Slot skill. */
export function branchSlotCap(): number {
  const mv = gs.stages.multiverse
  if (!mv) return 0
  const nodes = mv.generators.branchnode?.count ?? 0
  const extra = (gs.skills['multiverse:extra_slot'] ?? 0) >= 1 ? 1 : 0
  return nodes + extra
}

/** Production multiplier a stage receives from being cloned by active Multiverse branch slots. */
function duplicationMultFor(stageId: string): Dec {
  const mv = gs.stages.multiverse
  if (!mv?.unlocked) return ONE
  const slots = gs.multiverse?.branchSlots ?? []
  const cap = branchSlotCap()
  let copies = 0
  for (let i = 0; i < slots.length && i < cap; i++) if (slots[i] === stageId) copies++
  if (copies === 0) return ONE
  return ONE.add(D(dupPct() * mvEchoSustain * copies))
}

export function branchSlots(): string[] { return gs.multiverse?.branchSlots ?? [] }
export function echoSustain(): number { return mvEchoSustain }

/** Assign (or clear with '') the stage a duplication slot clones. */
export function assignBranchSlot(index: number, stageId: string): void {
  if (!gs.multiverse) gs.multiverse = { branchSlots: [] }
  const slots = gs.multiverse.branchSlots
  while (slots.length <= index) slots.push('')
  slots[index] = stageId
  saveGame(gs).catch(console.error)
}

/** Effective global multiplier = skill-derived globalMult × baked-in Convergence multiplier. */
function effGlobalMult(state: GameState = gs): Dec {
  return state.globalMult.mul(state.convergenceMult ?? ONE).mul(D(restrictionFor(state)?.prodMult ?? 1)).mul(D(state === gs ? eventBuffMult() : 1))
}

/** UI-facing list of a stage's incoming cross-stage bindings (may be empty). */
export function bindingInfos(stageId: string): BindingView[] {
  const rules = STAGE_BINDINGS[stageId]
  if (!rules) return []
  return rules.map(r => {
    const v = r.read(gs.stages)
    return { label: r.label, detail: r.detail(v), mult: r.mult(v), color: r.color, icon: r.icon }
  })
}

// ── Offline progress ───────────────────────────────────────────────────────
function applyOfflineProgress(state: GameState, elapsedMs: number): string | null {
  if (!state.settings.offlineProgress) return null
  const elapsedSec = elapsedMs / 1000
  if (elapsedSec < 10) return null  // not worth showing

  let summary = `You were away for ${formatDuration(elapsedSec)}.\n`
  for (const [sid, economy] of Object.entries(STAGE_ECONOMIES)) {
    const st = state.stages[sid]
    if (!st?.unlocked) continue
    // Read-only rates that honour cross-stage bindings, skills and enchants — far more
    // accurate than the old "tick a throwaway copy" path (which ignored all of those and
    // dropped secondary currency). useCache=false: we're operating on the loaded save,
    // not the live `gs`.
    const r = economy.rates(
      st,
      effGlobalMult(state),
      bindingMultFor(sid, state.stages, false),
      state.stages,
      state.activeEnchants,
      state.skills,
      state.spaceBuffers,
    )
    const def = STAGE_DEFS[sid as keyof typeof STAGE_DEFS]
    const gainedPrimary = offlineGain(r.primary, elapsedSec)
    const gainedSecondary = offlineGain(r.secondary, elapsedSec)
    st.primaryAmount = st.primaryAmount.add(gainedPrimary)
    st.primaryLifetime = st.primaryLifetime.add(gainedPrimary)
    st.secondaryAmount = st.secondaryAmount.add(gainedSecondary)
    summary += `  ${def.emoji} ${def.name}: +${fmt(gainedPrimary)} ${def.primaryCurrency.symbol}\n`
  }
  // Mint Fortune offline too, from the (now updated) surpluses — a single fair snapshot.
  const starRate = fortuneEngine.ratePreview(state.engine, state.stages, STAGE_DEFS, state.skills)
  const starGain = offlineGain(starRate, elapsedSec)
  if (starGain.gt(ZERO)) {
    state.engine.fortune = state.engine.fortune.add(starGain)
    state.engine.fortuneLifetime = state.engine.fortuneLifetime.add(starGain)
    if (!state.fortuneAllTime) state.fortuneAllTime = ZERO
    state.fortuneAllTime = state.fortuneAllTime.add(starGain)
    summary += `  ★ Fortune: +${fmt(starGain)}\n`
  }
  return summary
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${Math.floor(sec)}s`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${Math.floor(sec % 60)}s`
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`
}

// ── Game loop ──────────────────────────────────────────────────────────────
// Fixed-step simulation, decoupled from render (CLAUDE.md operating rule #4).
// A 60/120/144 Hz display still only steps the economy SIM_HZ times per second,
// so CPU stays flat regardless of monitor refresh rate — no thrash, no overheating.
const SIM_HZ = 20
const SIM_STEP = 1 / SIM_HZ            // seconds of game-time per fixed step
const MAX_CATCHUP_STEPS = 5            // guards against the "spiral of death"
let accumulator = 0

// Pre-cache the economy iteration list so the hot loop never calls Object.entries().
const ECONOMY_LIST = Object.entries(STAGE_ECONOMIES)

let offlineSummary = $state<string | null>(null)
let activeToasts = $state<{ id: number; text: string }[]>([])
let nextToastId = 0
let achCheckTimer = 0

// ── Events (claimable transient buffs) — runtime-only, not persisted ──────────
const EVENT_MIN_GAP = 180, EVENT_MAX_GAP = 420, EVENT_CLAIM_WINDOW = 30
type EventBuff = { id: string; mult: number; durationLeft: number }
type PendingEvent = { id: string; timeLeft: number }
function randGap() { return EVENT_MIN_GAP + Math.random() * (EVENT_MAX_GAP - EVENT_MIN_GAP) }
let eventBuff = $state<EventBuff | null>(null)
let pendingEvent = $state<PendingEvent | null>(null)
let eventSpawnTimer = randGap()

function spawnEvent() {
  const def = EVENTS[Math.floor(Math.random() * EVENTS.length)]
  pendingEvent = { id: def.id, timeLeft: EVENT_CLAIM_WINDOW }
}

/** Advance event timers one step. Exported (called by stepSim; also the test seam). */
export function tickEvents(dt: number) {
  if (eventBuff) {
    const left = eventBuff.durationLeft - dt
    eventBuff = left > 0 ? { ...eventBuff, durationLeft: left } : null
  }
  if (pendingEvent) {
    const left = pendingEvent.timeLeft - dt
    if (left > 0) pendingEvent = { ...pendingEvent, timeLeft: left }
    else { pendingEvent = null; eventSpawnTimer = randGap() }
  } else {
    eventSpawnTimer -= dt
    if (eventSpawnTimer <= 0) spawnEvent()
  }
}

export function claimEvent(): boolean {
  if (!pendingEvent) return false
  const def = EVENT_BY_ID[pendingEvent.id]
  if (!def) { pendingEvent = null; return false }
  eventBuff = { id: def.id, mult: def.mult, durationLeft: def.duration }
  pendingEvent = null
  eventSpawnTimer = randGap()
  pushToast(`⚡ ${def.name}! +${Math.round((def.mult - 1) * 100)}% production for ${def.duration}s`)
  return true
}

export function activeEventBuff(): EventBuff | null { return eventBuff }
export function claimableEvent(): PendingEvent | null { return pendingEvent }
export function eventBuffMult(): number { return eventBuff?.mult ?? 1 }
export function __forceSpawnEventForTest(id?: string) {
  pendingEvent = { id: id ?? EVENTS[0].id, timeLeft: EVENT_CLAIM_WINDOW }
}

function checkAchievements(state: GameState): string[] {
  if (!state.unlockedAchievements) state.unlockedAchievements = []
  const newlyUnlocked: string[] = []
  let anyNew = false
  for (const ach of ACHIEVEMENTS) {
    if (state.unlockedAchievements.includes(ach.id)) continue
    try {
      if (ach.check(state)) {
        state.unlockedAchievements.push(ach.id)
        newlyUnlocked.push(ach.name)
        anyNew = true
      }
    } catch (e) {
      console.error(`Error checking achievement ${ach.id}:`, e)
    }
  }
  if (anyNew) {
    recomputeUpgrades(state)
    saveGame(state).catch(console.error)
  }
  return newlyUnlocked
}

/** One fixed simulation step of `dt` seconds. Pure game-state mutation, no render. */
function stepSim(dt: number) {
  gs.totalPlaytimeMs += dt * 1000
  bindingStamp++   // invalidate the per-frame binding-mult cache; state is about to change

  // Tick active enchants
  if (gs.activeEnchants) {
    for (let i = gs.activeEnchants.length - 1; i >= 0; i--) {
      const enc = gs.activeEnchants[i]
      enc.durationLeft -= dt
      if (enc.durationLeft <= 0) {
        gs.activeEnchants.splice(i, 1)
      }
    }
  }

  // Effective global mult is invariant within a step (skills/convergence only change
  // outside the loop) — compute it once instead of twice per stage.
  const eff = effGlobalMult()

  // Village ticks before Farm (registration order), so Farm reads fresh Labor this step.
  for (let i = 0; i < ECONOMY_LIST.length; i++) {
    const [sid, economy] = ECONOMY_LIST[i]
    const st = gs.stages[sid]
    if (!st?.unlocked) continue          // O(active generators), skip locked stages
    economy.tick(
      st,
      dt,
      eff,
      bindingMultFor(sid, gs.stages, false),  // sim must see fresh in-step Labor, not cache
      gs.stages,
      gs.activeEnchants,
      gs.skills,
      gs.spaceBuffers
    )
    // Auto-buyer: one purchase per step (cheapest or smart priority), once the stage has prestiged.
    if (st.autoBuy && st.prestigeCount >= 1 && !activeChallengeRestriction()?.noAutoBuy) {
      economy.autoBuyTick(
        st,
        eff,
        bindingMultFor(sid, gs.stages, false),
        gs.stages,
        gs.activeEnchants,
        gs.skills,
        gs.spaceBuffers
      )
    }
  }

  const minted = fortuneEngine.tick(gs.engine, gs.stages, STAGE_DEFS, dt, gs.skills)
  if (!gs.fortuneAllTime) gs.fortuneAllTime = ZERO
  gs.fortuneAllTime = gs.fortuneAllTime.add(minted)

  // Warp charges recharge on a wall-clock cadence once Time is open.
  if (gs.warp && gs.stages.time?.unlocked) {
    const cap = warpChargeCap()
    if (gs.warp.charges < cap) {
      gs.warp.recharge += dt
      while (gs.warp.recharge >= WARP_RECHARGE_SEC && gs.warp.charges < cap) {
        gs.warp.recharge -= WARP_RECHARGE_SEC
        gs.warp.charges += 1
      }
      if (gs.warp.charges >= cap) gs.warp.recharge = 0
    } else {
      gs.warp.recharge = 0
    }
  }

  // Multiverse duplication draws Echoes each step; if Echoes can't cover upkeep, dupPct
  // delivery scales down via mvEchoSustain (read next step by duplicationMultFor()).
  const mv = gs.stages.multiverse
  if (mv?.unlocked && gs.multiverse) {
    const slots = gs.multiverse.branchSlots
    const cap = branchSlotCap()
    let activeSlots = 0
    for (let i = 0; i < slots.length && i < cap; i++) if (slots[i]) activeSlots++
    if (activeSlots > 0) {
      let upkeep = activeSlots * dupPct() * 40 // Echoes/s
      if ((gs.skills['multiverse:echo_reservoir'] ?? 0) >= 1) upkeep *= 0.6
      const need = upkeep * dt
      const have = mv.secondaryAmount.toNumber()
      if (have >= need) {
        mvEchoSustain = 1
        mv.secondaryAmount = mv.secondaryAmount.sub(D(need)).max(ZERO)
      } else {
        mvEchoSustain = need > 0 ? Math.max(0, have / need) : 1
        mv.secondaryAmount = ZERO
      }
    } else {
      mvEchoSustain = 1
    }
  } else {
    mvEchoSustain = 1
  }

  tickEvents(dt)

  achCheckTimer += dt
  if (achCheckTimer >= 1.0) {
    achCheckTimer = 0
    const newlyUnlocked = checkAchievements(gs)
    for (const name of newlyUnlocked) {
      pushToast(`🏆 Unlocked: ${name}`)
    }
  }
}

// ── Warp (Time stage) ────────────────────────────────────────────────────────
/** Max banked warp charges: base 2 + one per Chrono-Engine + Echo Charges skill. */
export function warpChargeCap(): number {
  const time = gs.stages.time
  if (!time) return WARP_BASE_CHARGE_CAP
  const engines = time.generators.chronoengine?.count ?? 0
  const echo = (gs.skills['time:echo_charges'] ?? 0) >= 1 ? 2 : 0
  return WARP_BASE_CHARGE_CAP + engines + echo
}

/** Longest warp duration (seconds of game-time) per cast — 300s, or 900s with Deep Warp. */
export function warpMaxDuration(): number {
  return (gs.skills['time:deep_warp'] ?? 0) >= 1 ? 900 : WARP_BASE_MAX_T
}

/** Current warp efficiency multiplier (Clocktower milestones × Eternity Spindle × Warp Mastery). */
export function warpEfficiency(): number {
  const time = gs.stages.time
  if (!time) return 1
  let eff = 1 + 0.015 * Math.floor((time.generators.clocktower?.count ?? 0) / 25)
  if ((time.generators.eternityspindle?.count ?? 0) >= 1) eff *= 1.5
  if ((gs.skills['time:warp_mastery'] ?? 0) >= 1) eff *= 1.25
  return eff
}

/** Chronon cost of a warp of `seconds` at the current Paradox level. */
export function warpCost(seconds: number): Dec {
  const paradox = gs.stages.time?.secondaryAmount ?? ZERO
  return D(500 * seconds).mul(ONE.add(paradox.div(D(100))))
}

export function warpState(): { charges: number; recharge: number } {
  return gs.warp ?? { charges: 0, recharge: 0 }
}

export const WARP_RECHARGE = WARP_RECHARGE_SEC

/**
 * Cast a warp: spend Chronons + one charge to apply `seconds` of simulated time to
 * the target stage's current production (burst offline-like gains). Accrues Paradox.
 * Returns the primary currency granted, or null if the cast was rejected.
 */
export function castWarp(targetStageId: string, seconds: number): Dec | null {
  const time = gs.stages.time
  if (!time?.unlocked || !gs.warp) return null
  const target = gs.stages[targetStageId]
  if (!target?.unlocked) return null

  const T = Math.max(1, Math.min(seconds, warpMaxDuration()))
  if (gs.warp.charges < 1) return null

  const cost = warpCost(T)
  if (time.primaryAmount.lt(cost)) return null

  const eff = warpEfficiency()
  const tr = stageRates(targetStageId)
  const gainPrimary = tr.primary.mul(D(T)).mul(D(eff))
  const gainSecondary = tr.secondary.gt(ZERO) ? tr.secondary.mul(D(T)).mul(D(eff)) : ZERO

  // Apply the burst to the target.
  target.primaryAmount = target.primaryAmount.add(gainPrimary)
  target.primaryLifetime = target.primaryLifetime.add(gainPrimary)
  if (gainSecondary.gt(ZERO)) target.secondaryAmount = target.secondaryAmount.add(gainSecondary)

  // Spend Chronons + a charge.
  time.primaryAmount = time.primaryAmount.sub(cost)
  gs.warp.charges -= 1

  // Accrue Paradox (reduced 0.5% per Epoch — temporal tolerance grows with ascension).
  const tolerance = Math.max(0.1, 1 - 0.005 * time.prestigeCurrency)
  const paradoxAccrued = 0.5 * T * tolerance
  time.secondaryAmount = time.secondaryAmount.add(D(paradoxAccrued))

  saveGame(gs).catch(console.error)
  return gainPrimary
}

// ── Convergence collapse (Multiverse capstone) ───────────────────────────────
const CONVERGENCE_SHARD_GATE = D(1e12)

/** Preview the Convergence collapse: the permanent ×mult it bakes + Convergence points granted. */
export function convergencePreview(): { mult: number; points: number; ready: boolean } {
  const mv = gs.stages.multiverse
  if (!mv?.unlocked) return { mult: 1, points: 0, ready: false }
  const coreOwned = (mv.generators.convergencecore?.count ?? 0) >= 1
  const allUnlocked = (Object.values(gs.stages) as StageState[]).every(s => s.unlocked)
  const shardsOk = mv.primaryAmount.gte(CONVERGENCE_SHARD_GATE)

  const coeff = (gs.skills['multiverse:stable_convergence'] ?? 0) >= 1 ? 0.14 : 0.10
  let sumLifetime = ZERO
  for (const s of Object.values(gs.stages) as StageState[]) sumLifetime = sumLifetime.add(s.primaryLifetime)
  const mult = 1 + coeff * sumLifetime.add(ONE).log10().toNumber()
  const points = STAGE_ECONOMIES.multiverse.prestigePreview(mv)
  return { mult, points, ready: coreOwned && allUnlocked && shardsOk && points > 0 }
}

/**
 * Collapse all branches: bake a permanent global ×mult into convergenceMult, grant
 * Convergence points, and reset Multiverse (Shards/Echoes/generators/branch slots).
 */
export function castConvergence(): boolean {
  const mv = gs.stages.multiverse
  if (!mv?.unlocked) return false
  const preview = convergencePreview()
  if (!preview.ready) return false

  gs.convergenceMult = gs.convergenceMult.mul(D(preview.mult))
  STAGE_ECONOMIES.multiverse.prestige(mv)  // grants Convergence points + resets shards/gens
  if (gs.multiverse) gs.multiverse.branchSlots = []
  saveGame(gs).catch(console.error)
  return true
}

export function convergenceMult(): Dec { return gs.convergenceMult ?? ONE }

/** Runtime unlock conditions. Cheap — runs once per animation frame. */
function checkUnlocks() {
  if (gs.activeChallenge && maybeCompleteChallenge()) return  // completed + restored this frame
  const startBoostLvl = gs.skills['tr:start_boost'] ?? 0
  const boostAmt = startBoostLvl > 0 ? D(Math.pow(10, 2 * startBoostLvl)) : ZERO

  const farm = gs.stages.farm
  if (farm && !farm.unlocked && gs.stages.village.primaryLifetime.gte(D(5000))) {
    farm.unlocked = true
    const seed = boostAmt.gt(D(25)) ? boostAmt : D(25)
    farm.primaryAmount = seed
    farm.primaryLifetime = seed
    fortuneEngine.assignSlot(gs.engine, 'farm')         // wire it into the Fortune Engine
    pushToast('🌾 The Farm is open — Village Labor now enriches every harvest!')
  }

  const mine = gs.stages.mine
  if (mine && !mine.unlocked && farm?.unlocked && farm.primaryLifetime.gte(D(5000))) {
    mine.unlocked = true
    const seed = boostAmt.gt(D(30)) ? boostAmt : D(30)
    mine.primaryAmount = seed
    mine.primaryLifetime = seed
    fortuneEngine.assignSlot(gs.engine, 'mine')
    pushToast('⛏️ The Mine is open — Village Labor and Farm Grain both feed the miners!')
  }

  const factory = gs.stages.factory
  if (factory && !factory.unlocked && mine?.unlocked && mine.primaryLifetime.gte(D(5000))) {
    factory.unlocked = true
    const seed = boostAmt.gt(D(35)) ? boostAmt : D(35)
    factory.primaryAmount = seed
    factory.primaryLifetime = seed
    fortuneEngine.assignSlot(gs.engine, 'factory')
    pushToast('🏭 The Factory is open — Farm Grain feeds the workers and Power fuels the future!')
  }

  const magic = gs.stages.magic
  if (magic && !magic.unlocked && factory?.unlocked && factory.primaryLifetime.gte(D(1e6))) {
    magic.unlocked = true
    const seed = boostAmt.gt(D(50)) ? boostAmt : D(50)
    magic.primaryAmount = seed
    magic.primaryLifetime = seed
    fortuneEngine.assignSlot(gs.engine, 'magic')
    pushToast('🔮 The Arcane Sanctum is open — cast powerful enchants using Mana!')
  }

  const space = gs.stages.space
  if (space && !space.unlocked && mine?.unlocked && mine.primaryLifetime.gte(D(5e5))) {
    // and factory is producing >= 1e3 kW/s sustained
    const factoryRate = stageRates('factory').secondary
    if (factoryRate.gte(D(1000))) {
      space.unlocked = true
      const seed = boostAmt.gt(D(100)) ? boostAmt : D(100)
      space.primaryAmount = seed
      space.primaryLifetime = seed
      fortuneEngine.assignSlot(gs.engine, 'space')
      pushToast('🚀 Space is open — construct Dyson Frames and fuel probes to harvest Stardust!')
    }
  }

  const time = gs.stages.time
  if (time && !time.unlocked && space?.unlocked && space.primaryLifetime.gte(D(5e6))) {
    // Time is meta-aware: it can only manipulate stages you've already "looped" — so it
    // opens once any two stages have ascended at least once.
    const ascended = (Object.values(gs.stages) as StageState[]).filter(s => s.prestigeCount >= 1).length
    if (ascended >= 2) {
      time.unlocked = true
      const seed = boostAmt.gt(D(250)) ? boostAmt : D(250)
      time.primaryAmount = seed
      time.primaryLifetime = seed
      fortuneEngine.assignSlot(gs.engine, 'time')
      pushToast('⏳ Time is open — spend Chronons on warp ticks to burst any stage forward!')
    }
  }

  const multiverse = gs.stages.multiverse
  if (multiverse && !multiverse.unlocked && time?.unlocked && time.primaryLifetime.gte(D(1e7))) {
    // The capstone: needs every prior stage open and Space supplying Alloy (Rifts run on it).
    const allPriorUnlocked = ['village', 'farm', 'mine', 'factory', 'magic', 'space', 'time']
      .every(id => gs.stages[id]?.unlocked)
    if (allPriorUnlocked && (gs.stages.space?.secondaryAmount.gt(ZERO) ?? false)) {
      multiverse.unlocked = true
      const seed = boostAmt.gt(D(6e5)) ? boostAmt : D(6e5)
      multiverse.primaryAmount = seed
      multiverse.primaryLifetime = seed
      fortuneEngine.assignSlot(gs.engine, 'multiverse')
      pushToast('🌌 The Multiverse opens — clone any stage, then collapse the branches for a permanent boost!')
    }
  }
}

let loopErrorCount = 0
function tick(nowMs: number) {
  // The whole body is wrapped so that a throw in ANY single frame can never stop the
  // loop. Before this guard, an exception in stepSim()/checkUnlocks() skipped the
  // requestAnimationFrame() below and silently bricked the game forever — which looked
  // like "stages don't unlock / stars stop / autosave dies / auto-buy dies" all at once,
  // and forced a page refresh (losing any progress since the last 30 s autosave).
  try {
    let frameDt = (nowMs - lastFrameMs) / 1000
    lastFrameMs = nowMs
    if (frameDt > 0.5) frameDt = 0.5       // tab was backgrounded; big gaps are handled by offline-progress
    accumulator += frameDt

    let steps = 0
    while (accumulator >= SIM_STEP && steps < MAX_CATCHUP_STEPS) {
      stepSim(SIM_STEP)
      accumulator -= SIM_STEP
      steps++
    }
    if (steps >= MAX_CATCHUP_STEPS) accumulator = 0  // drop backlog rather than chase it forever

    if (steps > 0) checkUnlocks()

    // Auto-save on wall-clock cadence
    if (nowMs - lastSaveMs > (gs.settings?.autoSaveInterval ?? 30_000)) {
      lastSaveMs = nowMs
      saveGame(gs).catch(console.error)
    }
  } catch (e) {
    // Log the first few occurrences (avoid console spam if a frame throws every tick),
    // but ALWAYS keep the loop alive via the finally below.
    if (loopErrorCount++ < 5) console.error('[game loop] recovered from tick error:', e)
  } finally {
    animFrameId = requestAnimationFrame(tick)
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

export function getState(): GameState { return gs }

export function getOfflineSummary() { return offlineSummary }
export function clearOfflineSummary() { offlineSummary = null }

export function getToasts() { return activeToasts }
export function removeToast(id: number) {
  activeToasts = activeToasts.filter(t => t.id !== id)
}
export function pushToast(text: string) {
  const id = nextToastId++
  activeToasts = [...activeToasts, { id, text }]
}

// Re-export the juice effects bus so UI imports from the store like everything else.
export { emitFloater, emitBurst, shake, getEffects, getShakeStamp, removeEffect } from './effects.svelte'

export function unlockedAchievements() { return gs.unlockedAchievements ?? [] }

export function buyGenerator(stageId: string, genId: string, amount: 1 | 10 | 100 | -1 = 1): boolean {
  const economy = STAGE_ECONOMIES[stageId]
  const st = gs.stages[stageId]
  if (!economy || !st) return false
  return economy.buy(st, genId, amount)
}

export function prestigeStage(stageId: string): number {
  if (activeChallengeRestriction()?.noPrestige) return 0   // challenge: prestige disabled
  const economy = STAGE_ECONOMIES[stageId]
  const st = gs.stages[stageId]
  if (!economy || !st) return 0
  const gain = economy.prestige(st)
  if (gain > 0) { grantDrop('common', RELIC_DROP.common); shake() }
  return gain
}

export function prestigePreview(stageId: string): number {
  const economy = STAGE_ECONOMIES[stageId]
  const st = gs.stages[stageId]
  if (!economy || !st) return 0
  return economy.prestigePreview(st)
}

// ── Ascension (deep meta reset → Legacy Points) ──────────────────────────────
export function legacyPoints(): number { return gs.legacyPoints ?? 0 }
export function ascensionCount(stageId: string): number { return gs.stages[stageId]?.ascensionCount ?? 0 }

/** LP a stage would mint if Ascended right now. */
export function ascensionPreview(stageId: string): number {
  const economy = STAGE_ECONOMIES[stageId]
  const st = gs.stages[stageId]
  if (!economy || !st) return 0
  return economy.ascensionPreview(st)
}

/** A stage can Ascend once it has prestiged at least once and would mint ≥ 1 LP. */
export function canAscend(stageId: string): boolean {
  const st = gs.stages[stageId]
  if (!st?.unlocked || st.prestigeCount < 1) return false
  return ascensionPreview(stageId) > 0
}

/** Perform the Ascension: credits the global LP pool and deep-resets the stage. Returns LP gained. */
export function ascendStage(stageId: string): number {
  const economy = STAGE_ECONOMIES[stageId]
  const st = gs.stages[stageId]
  if (!economy || !st || !canAscend(stageId)) return 0
  const gain = economy.ascend(st)
  if (gain > 0) {
    gs.legacyPoints += gain
    grantDrop('uncommon', RELIC_DROP.uncommon)
    shake()
    saveGame(gs).catch(console.error)
  }
  return gain
}

export function genCost(stageId: string, genId: string, amount = 1): Dec {
  const economy = STAGE_ECONOMIES[stageId]
  const st = gs.stages[stageId]
  if (!economy || !st) return ZERO
  return economy.currentCost(st, genId, amount)
}

export function canAffordGen(stageId: string, genId: string, amount = 1): boolean {
  const economy = STAGE_ECONOMIES[stageId]
  const st = gs.stages[stageId]
  if (!economy || !st) return false
  return economy.canAfford(st, genId, amount)
}

export function fortuneRate(): Dec {
  return fortuneEngine.ratePreview(gs.engine, gs.stages, STAGE_DEFS, gs.skills)
}

export function assignEngineSlot(stageId: string): void {
  fortuneEngine.assignSlot(gs.engine, stageId)
  saveGame(gs).catch(console.error)
}

export function assignEngineSlotAt(index: number, stageId: string): void {
  const slots = gs.engine.slots
  while (slots.length <= index) slots.push('')
  if (stageId !== '') {
    for (let i = 0; i < slots.length; i++) {
      if (i !== index && slots[i] === stageId) {
        slots[i] = ''
      }
    }
  }
  slots[index] = stageId
  saveGame(gs).catch(console.error)
}

/** Per-second production rates for a stage's currencies (read-only, safe per frame).
 *  Reads live state directly so a caller's $derived re-subscribes to the real inputs
 *  (generator counts, globalMult, bindings) and refreshes immediately on a purchase —
 *  not coupled to the sim loop. (A per-step memo here broke that and is intentionally gone.) */
export function stageRates(stageId: string): { primary: Dec; secondary: Dec; labor: Dec } {
  const economy = STAGE_ECONOMIES[stageId]
  const st = gs.stages[stageId]
  if (!economy || !st) return { primary: ZERO, secondary: ZERO, labor: ZERO }
  return economy.rates(st, effGlobalMult(), bindingMultFor(stageId), gs.stages, gs.activeEnchants, gs.skills, gs.spaceBuffers)
}


/** How much a single manual gather yields right now: ≥1, or ~3s of current production. */
export function gatherPreview(stageId: string): Dec {
  return ONE.max(stageRates(stageId).primary.mul(3))
}

/** Manual "work the stage" action — always lets you earn from zero (bootstraps every stage,
 *  including after a prestige reset). Counts toward lifetime, so it feeds unlocks/prestige. */
export function manualGather(stageId: string): Dec {
  const st = gs.stages[stageId]
  if (!st?.unlocked) return ZERO
  const amount = gatherPreview(stageId)
  st.primaryAmount = st.primaryAmount.add(amount)
  st.primaryLifetime = st.primaryLifetime.add(amount)
  return amount
}

/** Is a stage built and unlocked? (Only Village today; future stages are locked.) */
export function isStageUnlocked(stageId: string): boolean {
  return !!gs.stages[stageId]?.unlocked
}

// ── Auto-buyer (QoL automation) ──────────────────────────────────────────────
/** Auto-buy unlocks once a stage has been prestiged at least once. */
export function autoBuyUnlocked(stageId: string): boolean {
  if ((gs.transcendCount ?? 0) >= 1) return true
  return (gs.stages[stageId]?.prestigeCount ?? 0) >= 1 || (gs.stages[stageId]?.ascensionCount ?? 0) >= 1
}
export function isAutoBuyOn(stageId: string): boolean {
  return !!gs.stages[stageId]?.autoBuy
}
/** Toggle a stage's auto-buyer. Returns the new state. No-op if not yet unlocked. */
export function toggleAutoBuy(stageId: string): boolean {
  const st = gs.stages[stageId]
  if (!st || st.prestigeCount < 1) return false
  st.autoBuy = !st.autoBuy
  saveGame(gs).catch(console.error)
  return st.autoBuy
}

export function setAutoBuyMode(stageId: string, mode: 'cheapest' | 'priority'): void {
  const st = gs.stages[stageId]
  if (st && st.prestigeCount >= 1) {
    st.autoBuyMode = mode
    saveGame(gs).catch(console.error)
  }
}

export function setAutoBuyReserve(stageId: string, reserve: number): void {
  const st = gs.stages[stageId]
  if (st && st.prestigeCount >= 1) {
    st.autoBuyReserve = Math.max(0, Math.min(0.9, reserve))
    saveGame(gs).catch(console.error)
  }
}

export function setAutoBuyMilestoneSnipe(stageId: string, snipe: boolean): void {
  const st = gs.stages[stageId]
  if (st && st.prestigeCount >= 1) {
    st.autoBuyMilestoneSnipe = snipe
    saveGame(gs).catch(console.error)
  }
}

export function toggleAutoBuyVault(stageId: string, genId: string): void {
  const st = gs.stages[stageId]
  if (st && st.prestigeCount >= 1) {
    if (!st.autoBuyVault) st.autoBuyVault = []
    if (st.autoBuyVault.includes(genId)) {
      st.autoBuyVault = st.autoBuyVault.filter(id => id !== genId)
    } else {
      st.autoBuyVault.push(genId)
    }
    saveGame(gs).catch(console.error)
  }
}

// ── Global skill tree ───────────────────────────────────────────────────────
export function globalMult(): Dec { return gs.globalMult }
export function skillLevel(id: string): number { return gs.skills[id] ?? 0 }

export function skillCostFor(id: string): Dec {
  const node = SKILL_BY_ID[id]
  return node ? skillCost(node, gs.skills[id] ?? 0) : ZERO
}

export interface SkillStatus { maxed: boolean; locked: boolean; affordable: boolean; buyable: boolean }
export function skillStatus(id: string): SkillStatus {
  const node = SKILL_BY_ID[id]
  const lvl = gs.skills[id] ?? 0
  const maxed = !node || lvl >= node.maxLevel
  const locked = !node || !prereqsMet(node, gs.skills)
  const affordable = !maxed && gs.engine.fortune.gte(skillCostFor(id))
  return { maxed, locked, affordable, buyable: !maxed && !locked && affordable }
}

export function buySkill(id: string): boolean {
  const node = SKILL_BY_ID[id]
  if (!node) return false
  const lvl = gs.skills[id] ?? 0
  if (lvl >= node.maxLevel) return false
  if (!prereqsMet(node, gs.skills)) return false
  const cost = skillCost(node, lvl)
  if (gs.engine.fortune.lt(cost)) return false
  gs.engine.fortune = gs.engine.fortune.sub(cost)
  gs.skills[id] = lvl + 1
  recomputeUpgrades(gs)
  return true
}

// ── Ascension meta tree (spend LP) ───────────────────────────────────────────
export function ascSkillCostFor(id: string): Dec {
  const node = ASCENSION_BY_ID[id]
  return node ? skillCost(node, gs.skills[id] ?? 0) : ZERO
}

export function ascSkillStatus(id: string): SkillStatus {
  const node = ASCENSION_BY_ID[id]
  const lvl = gs.skills[id] ?? 0
  const maxed = !node || lvl >= node.maxLevel
  const locked = !node || !prereqsMet(node, gs.skills)
  const affordable = !maxed && D(gs.legacyPoints ?? 0).gte(ascSkillCostFor(id))
  return { maxed, locked, affordable, buyable: !maxed && !locked && affordable }
}

export function buyAscensionSkill(id: string): boolean {
  const node = ASCENSION_BY_ID[id]
  if (!node) return false
  const lvl = gs.skills[id] ?? 0
  if (lvl >= node.maxLevel) return false
  if (!prereqsMet(node, gs.skills)) return false
  const cost = skillCost(node, lvl)
  if (D(gs.legacyPoints ?? 0).lt(cost)) return false
  gs.legacyPoints -= Math.ceil(cost.toNumber())
  gs.skills[id] = lvl + 1
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  return true
}

export { GLOBAL_SKILLS, ASCENSION_SKILLS, TRANSCENDENCE_SKILLS, OMEGA_SKILLS, CHALLENGE_SKILLS, CHALLENGES, CHALLENGE_BY_ID }

// ── Transcendence meta-reset (spend ★ all-time for Aether) ───────────────────
export function transcSkillCostFor(id: string): number {
  const node = TRANSCEND_BY_ID[id]
  if (!node) return 0
  const lvl = gs.skills[id] ?? 0
  return Math.ceil(skillCost(node, lvl).toNumber())
}

export function transcSkillStatus(id: string): SkillStatus {
  const node = TRANSCEND_BY_ID[id]
  const lvl = gs.skills[id] ?? 0
  const maxed = !node || lvl >= node.maxLevel
  const locked = !node || !prereqsMet(node, gs.skills)
  const cost = transcSkillCostFor(id)
  const affordable = !maxed && (gs.aether ?? 0) >= cost
  return { maxed, locked, affordable, buyable: !maxed && !locked && affordable }
}

export function buyTranscendenceSkill(id: string): boolean {
  const node = TRANSCEND_BY_ID[id]
  if (!node) return false
  const lvl = gs.skills[id] ?? 0
  if (lvl >= node.maxLevel) return false
  if (!prereqsMet(node, gs.skills)) return false
  const cost = transcSkillCostFor(id)
  if ((gs.aether ?? 0) < cost) return false
  
  gs.aether = (gs.aether ?? 0) - cost
  gs.skills[id] = lvl + 1
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  return true
}

export function transcendPreview(): { aetherGained: number; totalAether: number; ready: boolean } {
  const lvl = gs.skills['tr:trans_multiplier'] ?? 0
  const rawAllTimeVal = gs.fortuneAllTime ? gs.fortuneAllTime.toNumber() : 0
  const baseGained = Math.floor(5 * Math.log10(1 + rawAllTimeVal / 1e6))
  const totalAetherGained = Math.floor(baseGained * (1 + 0.15 * lvl))
  const pending = Math.max(0, totalAetherGained - (gs.aetherLifetime ?? 0))
  return {
    aetherGained: pending,
    totalAether: (gs.aether ?? 0) + pending,
    ready: pending > 0
  }
}

export function transcend(): boolean {
  const preview = transcendPreview()
  if (!preview.ready) return false

  const pending = preview.aetherGained
  playTranscend()

  const metaAutomationActive = (gs.skills['tr:meta_automation'] ?? 0) >= 1
  const savedAutoBuySettings: Record<string, {
    autoBuy?: boolean
    autoBuyMode?: 'cheapest' | 'priority'
    autoBuyReserve?: number
    autoBuyMilestoneSnipe?: boolean
    autoBuyVault?: string[]
  }> = {}

  if (metaAutomationActive) {
    for (const [sid, st] of Object.entries(gs.stages) as [string, StageState][]) {
      savedAutoBuySettings[sid] = {
        autoBuy: st.autoBuy,
        autoBuyMode: st.autoBuyMode,
        autoBuyReserve: st.autoBuyReserve,
        autoBuyMilestoneSnipe: st.autoBuyMilestoneSnipe,
        autoBuyVault: st.autoBuyVault ? [...st.autoBuyVault] : []
      }
    }
  }

  // Wipe stages
  for (const sid of Object.keys(STAGE_ECONOMIES)) {
    gs.stages[sid] = STAGE_ECONOMIES[sid].freshState()
    if (metaAutomationActive && savedAutoBuySettings[sid]) {
      const saved = savedAutoBuySettings[sid]
      const st = gs.stages[sid]
      st.autoBuy = saved.autoBuy
      st.autoBuyMode = saved.autoBuyMode
      st.autoBuyReserve = saved.autoBuyReserve
      st.autoBuyMilestoneSnipe = saved.autoBuyMilestoneSnipe
      st.autoBuyVault = saved.autoBuyVault
    }
  }

  // Set locked/unlocked stages
  for (const sid of Object.keys(gs.stages)) {
    gs.stages[sid].unlocked = (sid === 'village')
  }

  // Seed starting primary currency using Start Boost level
  const startBoostLvl = gs.skills['tr:start_boost'] ?? 0
  const boostAmt = startBoostLvl > 0 ? D(Math.pow(10, 2 * startBoostLvl)) : ZERO
  if (boostAmt.gt(ZERO)) {
    gs.stages.village.primaryAmount = boostAmt
    gs.stages.village.primaryLifetime = boostAmt
  } else {
    gs.stages.village.primaryAmount = D(15)
    gs.stages.village.primaryLifetime = D(15)
  }

  // Reset Engine
  const savedSlots = gs.engine.slots
  gs.engine = fortuneEngine.freshState()
  if (metaAutomationActive) {
    gs.engine.slots = savedSlots
  }

  // Reset LP
  gs.legacyPoints = 0

  // Wipe global and ascension skills, retain Aether + Challenge (Medal) skills
  const nextSkills: Record<string, number> = {}
  for (const node of [...TRANSCENDENCE_SKILLS, ...CHALLENGE_SKILLS]) {
    const lvl = gs.skills[node.id] ?? 0
    if (lvl > 0) nextSkills[node.id] = lvl
  }
  gs.skills = nextSkills

  // Wipe enchants, space buffers, warp, multiverse
  gs.activeEnchants = []
  gs.spaceBuffers = { ore: ZERO, power: ZERO }
  gs.warp = { charges: WARP_BASE_CHARGE_CAP, recharge: 0 }
  gs.multiverse = { branchSlots: [] }
  gs.convergenceMult = ONE

  // Update Transcendence state
  gs.transcendCount = (gs.transcendCount ?? 0) + 1
  gs.aether = (gs.aether ?? 0) + pending
  gs.aetherLifetime = (gs.aetherLifetime ?? 0) + pending

  grantDrop('rare', RELIC_DROP.rare)
  shake()
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  return true
}

// ── Reality Reset meta-prestige (Omega Ω) — the layer above Transcendence ────
export function omegaSkillCostFor(id: string): number {
  const node = OMEGA_BY_ID[id]
  if (!node) return 0
  const lvl = gs.skills[id] ?? 0
  return Math.ceil(skillCost(node, lvl).toNumber())
}

export function omegaSkillStatus(id: string): SkillStatus {
  const node = OMEGA_BY_ID[id]
  const lvl = gs.skills[id] ?? 0
  const maxed = !node || lvl >= node.maxLevel
  const locked = !node || !prereqsMet(node, gs.skills)
  const cost = omegaSkillCostFor(id)
  const affordable = !maxed && (gs.omega ?? 0) >= cost
  return { maxed, locked, affordable, buyable: !maxed && !locked && affordable }
}

export function buyOmegaSkill(id: string): boolean {
  const node = OMEGA_BY_ID[id]
  if (!node) return false
  const lvl = gs.skills[id] ?? 0
  if (lvl >= node.maxLevel) return false
  if (!prereqsMet(node, gs.skills)) return false
  const cost = omegaSkillCostFor(id)
  if ((gs.omega ?? 0) < cost) return false

  gs.omega = (gs.omega ?? 0) - cost
  gs.skills[id] = lvl + 1
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  return true
}

export function omegaPreview(): { omegaGained: number; totalOmega: number; ready: boolean } {
  const lvl = gs.skills['om:reality_multiplier'] ?? 0
  const deserved = omegaGain(gs.aetherLifetime ?? 0, lvl)
  const pending = Math.max(0, deserved - (gs.omegaLifetime ?? 0))
  return {
    omegaGained: pending,
    totalOmega: (gs.omega ?? 0) + pending,
    ready: pending > 0,
  }
}

export function realityReset(): boolean {
  const preview = omegaPreview()
  if (!preview.ready) return false

  const pending = preview.omegaGained
  playTranscend()

  const metaActive = (gs.skills['om:eternal_engine'] ?? 0) >= 1
  const savedAutoBuySettings: Record<string, {
    autoBuy?: boolean
    autoBuyMode?: 'cheapest' | 'priority'
    autoBuyReserve?: number
    autoBuyMilestoneSnipe?: boolean
    autoBuyVault?: string[]
  }> = {}
  if (metaActive) {
    for (const [sid, st] of Object.entries(gs.stages) as [string, StageState][]) {
      savedAutoBuySettings[sid] = {
        autoBuy: st.autoBuy,
        autoBuyMode: st.autoBuyMode,
        autoBuyReserve: st.autoBuyReserve,
        autoBuyMilestoneSnipe: st.autoBuyMilestoneSnipe,
        autoBuyVault: st.autoBuyVault ? [...st.autoBuyVault] : [],
      }
    }
  }

  // Wipe stages → fresh, locked except Village
  for (const sid of Object.keys(STAGE_ECONOMIES)) {
    gs.stages[sid] = STAGE_ECONOMIES[sid].freshState()
    if (metaActive && savedAutoBuySettings[sid]) {
      const saved = savedAutoBuySettings[sid]
      const st = gs.stages[sid]
      st.autoBuy = saved.autoBuy
      st.autoBuyMode = saved.autoBuyMode
      st.autoBuyReserve = saved.autoBuyReserve
      st.autoBuyMilestoneSnipe = saved.autoBuyMilestoneSnipe
      st.autoBuyVault = saved.autoBuyVault
    }
  }
  for (const sid of Object.keys(gs.stages)) {
    gs.stages[sid].unlocked = (sid === 'village')
  }

  // Seed Village — honor the (persisting) Aether Start Boost, else default 15.
  const startBoostLvl = gs.skills['tr:start_boost'] ?? 0
  const boostAmt = startBoostLvl > 0 ? D(Math.pow(10, 2 * startBoostLvl)) : ZERO
  if (boostAmt.gt(ZERO)) {
    gs.stages.village.primaryAmount = boostAmt
    gs.stages.village.primaryLifetime = boostAmt
  } else {
    gs.stages.village.primaryAmount = D(15)
    gs.stages.village.primaryLifetime = D(15)
  }

  // Reset Engine (restore slots if Eternal Engine owned)
  const savedSlots = gs.engine.slots
  gs.engine = fortuneEngine.freshState()
  if (metaActive) gs.engine.slots = savedSlots

  // Reset LP
  gs.legacyPoints = 0

  // Wipe Global + Ascension skills; KEEP Aether (tr:*), Omega (om:*) AND Challenge (ch:*) trees
  const nextSkills: Record<string, number> = {}
  for (const node of [...TRANSCENDENCE_SKILLS, ...OMEGA_SKILLS, ...CHALLENGE_SKILLS]) {
    const lvl = gs.skills[node.id] ?? 0
    if (lvl > 0) nextSkills[node.id] = lvl
  }
  gs.skills = nextSkills

  // Wipe enchants, space buffers, warp, multiverse, convergence
  gs.activeEnchants = []
  gs.spaceBuffers = { ore: ZERO, power: ZERO }
  gs.warp = { charges: WARP_BASE_CHARGE_CAP, recharge: 0 }
  gs.multiverse = { branchSlots: [] }
  gs.convergenceMult = ONE

  // Wipe the Aether POOL + transcend count (design Q1: Ω wipes Æ pool, keeps Æ tree)
  gs.aether = 0
  gs.transcendCount = 0

  // Update Omega state
  gs.omegaCount = (gs.omegaCount ?? 0) + 1
  gs.omega = (gs.omega ?? 0) + pending
  gs.omegaLifetime = (gs.omegaLifetime ?? 0) + pending

  grantDrop('legendary', RELIC_DROP.legendary)
  shake()
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  return true
}

// ── Challenges (snapshot-and-restore restricted runs) ────────────────────────
export function enterChallenge(id: string): boolean {
  if (gs.activeChallenge) return false                       // one at a time
  const def = CHALLENGE_BY_ID[id]
  if (!def) return false
  if (def.requires?.some(r => !(gs.completedChallenges ?? []).includes(r))) return false
  const blob = exportSave(gs)                                // stash the real save
  const run = freshGameState()
  run.activeChallenge = id
  run.challengeSnapshot = blob
  gs = run
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  pushToast(`⚔ Challenge started: ${def.name}`)
  return true
}

/** Called once per frame from checkUnlocks while a challenge is active.
 *  Returns true if it completed + restored this frame. Exported for tests. */
export function maybeCompleteChallenge(): boolean {
  const id = gs.activeChallenge
  if (!id) return false
  const def = CHALLENGE_BY_ID[id]
  if (!def || !def.check(gs)) return false
  const earned = def.medalReward
  const real = gs.challengeSnapshot ? importSave(gs.challengeSnapshot) : null
  if (!real) { gs.activeChallenge = null; return true }       // fail-safe: clear the marker
  if (!real.completedChallenges) real.completedChallenges = []
  if (!real.completedChallenges.includes(id)) {
    real.completedChallenges.push(id)
    real.medals = (real.medals ?? 0) + earned
  }
  real.activeChallenge = null
  real.challengeSnapshot = undefined
  gs = real
  grantDrop('uncommon', RELIC_DROP.uncommon)
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  pushToast(`🎖️ Challenge complete: ${def.name} (+${earned} Medals)`)
  return true
}

export function abandonChallenge(): boolean {
  if (!gs.activeChallenge) return false
  const real = gs.challengeSnapshot ? importSave(gs.challengeSnapshot) : null
  if (!real) return false
  real.activeChallenge = null
  real.challengeSnapshot = undefined
  gs = real
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  pushToast('Challenge abandoned — your reality is restored.')
  return true
}

export function challengeSkillCostFor(id: string): number {
  const node = CHALLENGE_SKILL_BY_ID[id]
  if (!node) return 0
  const lvl = gs.skills[id] ?? 0
  return Math.ceil(skillCost(node, lvl).toNumber())
}

export function challengeSkillStatus(id: string): SkillStatus {
  const node = CHALLENGE_SKILL_BY_ID[id]
  const lvl = gs.skills[id] ?? 0
  const maxed = !node || lvl >= node.maxLevel
  const locked = !node || !prereqsMet(node, gs.skills)
  const cost = challengeSkillCostFor(id)
  const affordable = !maxed && (gs.medals ?? 0) >= cost
  return { maxed, locked, affordable, buyable: !maxed && !locked && affordable }
}

export function buyChallengeSkill(id: string): boolean {
  const node = CHALLENGE_SKILL_BY_ID[id]
  if (!node) return false
  const lvl = gs.skills[id] ?? 0
  if (lvl >= node.maxLevel) return false
  if (!prereqsMet(node, gs.skills)) return false
  const cost = challengeSkillCostFor(id)
  if ((gs.medals ?? 0) < cost) return false

  gs.medals = (gs.medals ?? 0) - cost
  gs.skills[id] = lvl + 1
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  return true
}

export function fmt(v: Dec | number, decimals = 2): string {
  return baseFmt(v, gs?.settings?.numberFormat ?? 'short', decimals)
}

export function fmtRate(v: Dec | number): string {
  return fmt(v) + '/s'
}

export function getSettings() {
  return gs.settings
}

export function resetTutorials() {
  if (gs && gs.settings) {
    gs.settings.seenTutorials = {}
    saveGame(gs).catch(console.error)
  }
}

export function exportActiveSave(): string {
  return exportSave(gs)
}

// Shared swap: replace the live game state, persist, recompute derived multipliers,
// and rebase the loop clock. Used by both manual Import and Cloud Pull.
function swapInState(imported: GameState) {
  cancelAnimationFrame(animFrameId)
  hydrateStages(imported)   // repair shape (missing stages/generators) before it goes live
  gs = imported
  saveGame(gs)
  recomputeUpgrades(gs)
  lastFrameMs = Date.now()
  animFrameId = requestAnimationFrame(tick)
}

export function importActiveSave(encoded: string): boolean {
  const imported = importSave(encoded)
  if (!imported) return false
  swapInState(imported)
  return true
}

export type CloudPushResult =
  | { status: 'ok' }
  | { status: 'conflict'; cloud: CloudMeta; local: CloudMeta }
  | { status: 'error'; error: string }
  | { status: 'unconfigured' }
  | { status: 'unauthenticated' }

export type CloudPullResult =
  | { status: 'ok' }
  | { status: 'empty' }
  | { status: 'conflict'; cloud: CloudMeta; local: CloudMeta }
  | { status: 'corrupt' }
  | { status: 'unconfigured' }
  | { status: 'unauthenticated' }

// Push the local save to the cloud. Guards against overwriting a NEWER cloud copy
// (returns 'conflict' without writing) unless { force: true }.
export async function cloudPush(opts: { force?: boolean } = {}): Promise<CloudPushResult> {
  if (!isCloudConfigured()) return { status: 'unconfigured' }
  if (!(await currentUser())) return { status: 'unauthenticated' }
  const blob = exportSave(gs)                 // also refreshes gs.saveTimestamp
  const local: CloudMeta = { saveVersion: gs.version, saveTimestamp: gs.saveTimestamp }
  if (!opts.force) {
    const meta = await fetchCloudMeta()
    if (meta && meta.saveTimestamp > gs.saveTimestamp) return { status: 'conflict', cloud: meta, local }
  }
  const res = await pushSave({ blob, saveVersion: gs.version, saveTimestamp: gs.saveTimestamp })
  if (res.ok) { pushToast('☁ Progress pushed to cloud'); return { status: 'ok' } }
  return { status: 'error', error: res.error ?? 'Push failed.' }
}

// Pull the cloud save and replace local. Guards against overwriting a NEWER local
// copy (returns 'conflict' without swapping) unless { force: true }.
export async function cloudPull(opts: { force?: boolean } = {}): Promise<CloudPullResult> {
  if (!isCloudConfigured()) return { status: 'unconfigured' }
  if (!(await currentUser())) return { status: 'unauthenticated' }
  const cloud = await pullSave()
  if (!cloud) return { status: 'empty' }
  const local: CloudMeta = { saveVersion: gs.version, saveTimestamp: gs.saveTimestamp }
  if (!opts.force && gs.saveTimestamp > cloud.saveTimestamp) {
    return { status: 'conflict', cloud: { saveVersion: cloud.saveVersion, saveTimestamp: cloud.saveTimestamp }, local }
  }
  const imported = importSave(cloud.blob)
  if (!imported) return { status: 'corrupt' }
  swapInState(imported)
  pushToast('☁ Progress pulled from cloud')
  return { status: 'ok' }
}

export { STAGE_DEFS, saveGame }

export function activeEnchants() { return gs.activeEnchants ?? [] }
export function spaceBuffers() { return gs.spaceBuffers }

export function castEnchant(enchantId: string, targetStageId: string, essenceSpent: number): boolean {
  if (!gs.activeEnchants) gs.activeEnchants = []
  
  // Slots limit
  let maxSlots = 2
  if ((gs.skills['magic:twin_casting'] ?? 0) >= 1) maxSlots += 1
  if ((gs.stages.magic?.generators.archmage?.count ?? 0) >= 50) maxSlots += 1
  if (gs.activeEnchants.length >= maxSlots) return false

  const magic = gs.stages.magic
  if (!magic || !magic.unlocked) return false

  // Cost rules
  let pctCost = 0
  let baseMult = 1
  let baseDuration = 0
  let ampPer1k = 0
  let canAmp = false

  if (enchantId === 'quicken') {
    pctCost = 0.05
    baseMult = 3
    baseDuration = 60
    ampPer1k = 0.5
    canAmp = true
  } else if (enchantId === 'greater_quicken') {
    pctCost = 0.20
    baseMult = 7
    baseDuration = 90
    ampPer1k = 1.0
    canAmp = true
  } else if (enchantId === 'mass_enchant') {
    pctCost = 0.40
    baseMult = 2.5
    baseDuration = 45
    canAmp = false
    targetStageId = 'all'
  } else if (enchantId === 'overcharge') {
    pctCost = 0.75
    baseMult = 12
    baseDuration = 30
    ampPer1k = 0.5
    canAmp = true
  } else {
    return false
  }

  // Mana cost is a fraction (pctCost ≤ 1) of current Mana, so it is always
  // affordable by construction — no separate guard needed.
  const manaCost = magic.primaryAmount.mul(pctCost)

  // Essence cost check
  const actualEssence = canAmp ? Math.max(0, essenceSpent) : 0
  const essenceCost = D(actualEssence)
  if (magic.secondaryAmount.lt(essenceCost)) return false

  // Subtract costs
  magic.primaryAmount = magic.primaryAmount.sub(manaCost)
  magic.secondaryAmount = magic.secondaryAmount.sub(essenceCost)

  // Potency calculations
  const runesmiths = magic.generators.runesmith?.count ?? 0
  const enduringGlyphs = (gs.skills['magic:enduring_glyphs'] ?? 0) >= 1
  const durationMult = 1 + 0.02 * Math.floor(runesmiths / 25) + (enduringGlyphs ? 0.50 : 0)
  const duration = baseDuration * durationMult

  let multiplier = D(baseMult)
  if (canAmp && actualEssence > 0) {
    const K = magic.generators.astralconduit?.count ?? 0
    const ampAmount = (actualEssence / 1000) * ampPer1k
    const ampCap = baseMult * (1 + 0.25 * K)
    multiplier = D(Math.min(baseMult + ampAmount, ampCap))
  }

  // Overcharge backfire roll
  if (enchantId === 'overcharge') {
    const backfireWard = (gs.skills['magic:backfire_ward'] ?? 0) >= 1
    const risk = backfireWard ? 0.03 : 0.15
    if (Math.random() < risk) {
      multiplier = D(0.5)
    }
  }

  // Push active enchant
  gs.activeEnchants.push({
    id: enchantId,
    targetStageId,
    multiplier,
    durationLeft: duration,
    totalDuration: duration
  })

  saveGame(gs).catch(console.error)
  return true
}

export function buyLocalSkill(nodeId: string, stageId: string): boolean {
  const node = LOCAL_SKILL_BY_ID[nodeId]
  if (!node) return false
  const lvl = gs.skills[nodeId] ?? 0
  if (lvl >= node.maxLevel) return false
  
  const met = node.requires.every(r => (gs.skills[r] ?? 0) >= 1)
  if (!met) return false

  const cost = Math.floor(node.baseCost * Math.pow(node.costGrowth, lvl))
  const st = gs.stages[stageId]
  if (!st || st.prestigeCurrency < cost) return false

  st.prestigeCurrency -= cost
  gs.skills[nodeId] = lvl + 1
  recomputeUpgrades(gs)
  saveGame(gs).catch(console.error)
  return true
}

// ── Initialise ─────────────────────────────────────────────────────────────

/** Repair a loaded save so its shape always matches the current stage defs:
 *  backfill any missing stage AND any missing generator entry within a stage.
 *  A save predating an added generator otherwise has `state.generators[id] === undefined`,
 *  which threw on the first tick and killed the game loop. */
function hydrateStages(state: GameState): void {
  if (!state.stages) state.stages = {} as GameState['stages']
  for (const [sid, economy] of Object.entries(STAGE_ECONOMIES)) {
    const fresh = economy.freshState()
    const st = state.stages[sid]
    if (!st) {
      state.stages[sid] = fresh
      continue
    }
    if (!st.generators) st.generators = {}
    for (const g of economy.def.generators) {
      if (!st.generators[g.id]) {
        st.generators[g.id] = { id: g.id, count: 0, totalProduced: ZERO }
      }
    }
  }
}

export async function initGame() {
  if (initialized) return
  const saved = await loadGame()
  if (saved) {
    hydrateStages(saved)   // repair shape BEFORE offline progress reads rates()
    const elapsed = Date.now() - saved.saveTimestamp
    offlineSummary = applyOfflineProgress(saved, elapsed)
    gs = saved
    if (!gs.engine) gs.engine = fortuneEngine.freshState()
    if (!gs.skills) gs.skills = {}
    if (!gs.activeEnchants) gs.activeEnchants = []
    if (!gs.spaceBuffers) gs.spaceBuffers = { ore: ZERO, power: ZERO }
    if (!gs.warp) gs.warp = { charges: WARP_BASE_CHARGE_CAP, recharge: 0 }
    if (!gs.multiverse) gs.multiverse = { branchSlots: [] }
    if (!gs.convergenceMult) gs.convergenceMult = ONE
    if (gs.legacyPoints == null) gs.legacyPoints = 0
    recomputeUpgrades(gs)  // rebuild globalMult / engineMult from saved skill levels
  } else if (consumeLoadError()) {
    // A save existed but couldn't be read — a backup of the raw blob was kept so it's
    // not lost. Warn the player rather than silently dropping them into a fresh game.
    pushToast('⚠️ Your save could not be read. A backup was kept and a fresh game started — your old data was not overwritten.')
  } else if (consumeRebalanceReset()) {
    // A pre-v5 save was discarded for the economy rebalance — tell the player why.
    pushToast('⚙️ Economy rebalanced — the grind is slower and fairer now. Fresh save started.')
  }
  setJuice(gs.settings?.juice ?? 'full')   // sync the effects gate to the saved/fresh preference
  initialized = true
  lastFrameMs = Date.now()
  lastSaveMs = Date.now()
  animFrameId = requestAnimationFrame(tick)
}

export function hardReset() {
  cancelAnimationFrame(animFrameId)
  gs = freshGameState()
  saveGame(gs)
  lastFrameMs = Date.now()
  animFrameId = requestAnimationFrame(tick)
}

/** Test-only: reset the live store to a fresh game WITHOUT starting the rAF loop
 *  (keeps store integration tests deterministic). Not used in production. */
export function __resetStoreForTest() { gs = freshGameState(); eventBuff = null; pendingEvent = null; eventSpawnTimer = randGap() }

export function isInitialized() { return initialized }

