/**
 * Audio — retro SFX synthesized live via the Web Audio API.
 * Zero asset files, zero downloads, zero dependencies. Lazily creates the
 * AudioContext on the first sound (after a user gesture, per browser policy).
 * Lightweight per perf rule #4: each blip is one short-lived oscillator.
 */
let ctx: AudioContext | null = null
let muted = false

function ac(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function setMuted(m: boolean) { muted = m }
export function isMuted(): boolean { return muted }
export function toggleMuted(): boolean { muted = !muted; return muted }

/** A single short tone with an exponential decay envelope. */
function blip(freq: number, dur: number, type: OscillatorType = 'square', gain = 0.05, when = 0) {
  if (muted) return
  const c = ac()
  const t = c.currentTime + when
  const osc = c.createOscillator()
  const env = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  env.gain.setValueAtTime(gain, t)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(env)
  env.connect(c.destination)
  osc.start(t)
  osc.stop(t + dur)
}

/** Soft two-note "coin" on a purchase. */
export function playBuy() {
  blip(740, 0.05, 'square', 0.035)
  blip(990, 0.07, 'square', 0.03, 0.045)
}

/** Bright sweep when a generator crosses a milestone tier. */
export function playMilestone() {
  blip(880, 0.10, 'sawtooth', 0.035)
  blip(1175, 0.12, 'sawtooth', 0.035, 0.06)
  blip(1568, 0.14, 'triangle', 0.03, 0.12)
}

/** Ascending arpeggio fanfare on prestige. */
export function playPrestige() {
  const notes = [523, 659, 784, 1047, 1319]
  notes.forEach((f, i) => blip(f, 0.22, 'triangle', 0.045, i * 0.07))
}

/** Epic cosmic arpeggio and reflection on Transcendence. */
export function playTranscend() {
  const notes = [523, 587, 659, 784, 880, 1047, 1175, 1319]
  notes.forEach((f, i) => blip(f, 0.35, 'sawtooth', 0.02, i * 0.05))
  notes.reverse().forEach((f, i) => blip(f, 0.35, 'triangle', 0.02, 0.4 + i * 0.05))
}
