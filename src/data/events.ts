export interface GameEvent {
  id: string
  name: string
  icon: string
  mult: number      // production multiplier while active (3 = +200%)
  duration: number  // seconds the buff lasts after claiming
}

export const EVENTS: GameEvent[] = [
  { id: 'golden_cog',  name: 'Golden Cog',  icon: '⚙️', mult: 3,   duration: 30 },
  { id: 'lucky_surge', name: 'Lucky Surge', icon: '🍀', mult: 5,   duration: 15 },
  { id: 'steady_boon', name: 'Steady Boon', icon: '🕯️', mult: 2,   duration: 60 },
  { id: 'overclock',   name: 'Overclock',   icon: '⚡', mult: 3.5, duration: 25 },
]

export const EVENT_BY_ID: Record<string, GameEvent> = Object.fromEntries(EVENTS.map(e => [e.id, e]))
