<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { Application, Graphics, Text, TextStyle, Container } from 'pixi.js'
  import type { Ticker } from 'pixi.js'
  import { stageState } from '../stores/game.svelte'
  import { fmt } from '../systems/Decimal'

  interface Props { stageId: string }
  let { stageId }: Props = $props()

  const W = 220, H = 400
  const isFarm = $derived(stageId === 'farm')
  const isMine = $derived(stageId === 'mine')
  const isFactory = $derived(stageId === 'factory')
  const isMagic = $derived(stageId === 'magic')
  const isSpace = $derived(stageId === 'space')
  const visualGen = $derived(isMine ? 'prospector' : isFarm ? 'field' : isFactory ? 'boilerassistant' : isMagic ? 'sigil' : isSpace ? 'probe' : 'cottage')


  let canvasEl: HTMLCanvasElement
  let app: Application | null = null

  const getCount  = () => stageState(stageId)?.generators?.[visualGen]?.count ?? 0
  const getAmount = () => stageState(stageId)?.primaryAmount?.toNumber() ?? 0

  // Each pop owns its Text node (created once on spawn, updated in place, destroyed on
  // death) — mirrors the particle pattern. Never recreate Text per frame (alloc churn).
  interface Pop { t: Text; x: number; y: number; life: number; vx: number; vy: number }
  let pops: Pop[] = []
  const popStyle = new TextStyle({ fill: '#ffd76b', fontSize: 11, fontFamily: 'Spline Sans Mono, monospace' })

  interface Particle { g: Graphics; life: number; max: number }
  let particles: Particle[] = []
  interface Star { g: Graphics; base: number; speed: number; phase: number }
  let stars: Star[] = []
  interface Flicker { g: Graphics; base: number; phase: number }
  let flickers: Flicker[] = []

  // ── VILLAGE (night) ─────────────────────────────────────────────────────────
  const HOUSES: [number, number][] = [
    [22, 296], [150, 300], [86, 282], [186, 286],
    [50, 266], [120, 262], [16, 252], [160, 258], [92, 240],
  ]
  const visibleHouses = (c: number) => Math.max(2, Math.min(c, HOUSES.length))
  function drawVillage(g: Graphics, houses: number) {
    g.clear()
    const sky = [0x0a0a1e, 0x10112c, 0x171a38, 0x1e2444, 0x283154]
    for (let i = 0; i < sky.length; i++) g.rect(0, i * 36, W, 38).fill(sky[i])
    g.rect(0, 180, W, 60).fill(0x2a3358)
    g.circle(182, 40, 22).fill({ color: 0xffe8a0, alpha: 0.10 })
    g.circle(182, 40, 16).fill({ color: 0xffe8a0, alpha: 0.18 })
    g.circle(182, 40, 12).fill(0xfff0c4)
    g.circle(188, 35, 10).fill(0x283154)
    g.poly([0, 220, 60, 196, 120, 214, 180, 192, 220, 210, 220, 240, 0, 240]).fill(0x20305a)
    g.poly([0, 232, 70, 214, 140, 228, 220, 210, 220, 252, 0, 252]).fill(0x18284a)
    g.rect(0, 240, W, H - 240).fill(0x24401f)
    g.rect(0, 240, W, 10).fill(0x2c4a26)
    g.poly([92, 240, 128, 240, 150, 400, 70, 400]).fill(0x7a6347)
    g.poly([104, 240, 116, 240, 124, 400, 96, 400]).fill({ color: 0x8c7456, alpha: 0.6 })
    for (const [tx, ty] of [[8, 236], [40, 230], [205, 234], [175, 228]] as [number, number][]) {
      g.poly([tx, ty, tx + 6, ty - 14, tx + 12, ty]).fill(0x16301a)
      g.rect(tx + 4, ty, 4, 5).fill(0x3a2a18)
    }
    for (let i = houses - 1; i >= 0; i--) drawHouse(g, HOUSES[i][0], HOUSES[i][1])
    g.rect(60, 332, 16, 10).fill(0x5a4a3a); g.rect(60, 326, 16, 3).fill(0x3a2f24)
    g.poly([57, 326, 68, 318, 79, 326]).fill(0x6a3328)
  }
  function drawHouse(g: Graphics, x: number, y: number) {
    g.rect(x, y, 24, 18).fill(0x9a7a55); g.rect(x + 18, y, 6, 18).fill(0x7a5f42)
    g.poly([x - 3, y, x + 12, y - 12, x + 27, y]).fill(0x8a3326)
    g.poly([x - 3, y, x + 12, y - 12, x + 12, y]).fill(0x9c4232)
    g.rect(x + 17, y - 10, 4, 8).fill(0x6a4a35)
    g.rect(x + 4, y + 10, 5, 8).fill(0x4a3020)
    g.rect(x + 13, y + 4, 6, 6).fill(0xffd76b)
  }

  // ── FARM (day) ──────────────────────────────────────────────────────────────
  const visibleRows = (c: number) => Math.min(Math.floor(c / 2) + 1, 7)
  function drawFarm(g: Graphics, rows: number) {
    g.clear()
    const sky = [0x355a86, 0x4a72a0, 0x6f98bc, 0x9cc0d2, 0xcfe3df]
    for (let i = 0; i < sky.length; i++) g.rect(0, i * 30, W, 32).fill(sky[i])
    g.circle(40, 44, 24).fill({ color: 0xffe6a0, alpha: 0.12 })
    g.circle(40, 44, 17).fill({ color: 0xffe6a0, alpha: 0.22 })
    g.circle(40, 44, 12).fill(0xfff2c8)
    g.poly([0, 168, 70, 146, 150, 166, 220, 150, 220, 200, 0, 200]).fill(0x6a9a4a)
    g.poly([0, 188, 90, 170, 220, 188, 220, 220, 0, 220]).fill(0x568a3c)
    g.rect(0, 210, W, H - 210).fill(0x6b4a2c); g.rect(0, 210, W, 8).fill(0x7c5836)
    for (let r = 0; r < 7; r++) {
      const y = 226 + r * 23
      g.rect(8, y, W - 16, 3).fill(0x4f3620)
      if (r < rows) {
        for (let x = 14; x < W - 14; x += 12) {
          const tall = (r % 2 === 0)
          g.rect(x, y - (tall ? 8 : 6), 2, tall ? 8 : 6).fill(0x4f8a3a)
          g.rect(x - 1, y - (tall ? 10 : 8), 4, 2).fill(tall ? 0xe6c84a : 0x6fae4a)
        }
      }
    }
    g.rect(160, 168, 40, 30).fill(0xa6402e); g.rect(160, 168, 40, 4).fill(0x8a3326)
    g.poly([156, 168, 180, 150, 204, 168]).fill(0x7a2c22)
    g.rect(174, 178, 12, 20).fill(0x6a2c20); g.rect(178, 178, 4, 20).fill(0x4a1c14)
    g.rect(164, 174, 6, 6).fill(0xf0e0b0)
    for (let fx = 6; fx < 60; fx += 12) g.rect(fx, 198, 2, 12).fill(0x8a6a44)
    g.rect(6, 201, 54, 2).fill(0x8a6a44)
  }
  function buildWindmill() {
    const root = new Container()
    const tower = new Graphics()
    tower.poly([108, 210, 120, 210, 124, 168, 104, 168]).fill(0xe8e0cc)
    tower.poly([108, 210, 113, 210, 110, 168, 104, 168]).fill(0xcfc6ad)
    tower.rect(110, 192, 8, 12).fill(0x8a6a44)
    root.addChild(tower)
    const blades = new Container(); blades.x = 114; blades.y = 166
    for (let i = 0; i < 4; i++) {
      const b = new Graphics(); b.poly([0, 0, 4, -3, 26, -2, 26, 2, 4, 3]).fill(0xf4ead0)
      b.rotation = (Math.PI / 2) * i; blades.addChild(b)
    }
    const hub = new Graphics(); hub.circle(0, 0, 3).fill(0x8a6a44); blades.addChild(hub)
    root.addChild(blades)
    return { root, blades }
  }

  // ── FACTORY (industrial) ───────────────────────────────────────────────────
  const visibleBoilers = (c: number) => Math.max(1, Math.min(c, 8))
  const BOILER_SPOTS: [number, number][] = [
    [24, 280], [146, 280], [85, 260], [176, 250],
    [50, 230], [120, 220], [16, 200], [150, 210]
  ]
  function drawFactory(g: Graphics, boilers: number) {
    g.clear()
    // Charcoal/iron backdrop panels
    const panels = [0x141215, 0x1c191e, 0x242026, 0x1c191e, 0x141215, 0x221d23, 0x1a161b, 0x242026]
    for (let i = 0; i < 8; i++) g.rect(0, i * 52, W, 54).fill(panels[i])

    // Draw copper/iron pipes running along the walls
    g.rect(14, 0, 4, H).fill(0x70523d)  // vertical pipe left
    g.rect(202, 0, 4, H).fill(0x56565e) // vertical pipe right
    g.rect(0, 90, W, 6).fill(0x70523d)  // horizontal copper pipe
    g.rect(0, 310, W, 6).fill(0x56565e) // horizontal iron pipe

    // Pipe joints/valves
    g.circle(16, 93, 6).fill(0x8c6245)
    g.circle(204, 313, 6).fill(0x757580)
    g.circle(110, 93, 8).fill(0xd4a843) // Brass main valve wheel

    // Dial background
    g.circle(110, 180, 15).fill(0xece3d0)
    g.circle(110, 180, 13).fill(0x0a0812)
    // Red indicator needle pointing right
    g.poly([110, 180, 110, 170, 111, 180]).fill(0xd65a5a)

    // Draw the Boilers (brick furnace blocks with active fires inside!)
    const activeBoilers = Math.min(boilers, BOILER_SPOTS.length)
    for (let i = 0; i < activeBoilers; i++) {
      const [bx, by] = BOILER_SPOTS[i]
      drawBoiler(g, bx, by)
    }
  }

  function drawBoiler(g: Graphics, x: number, y: number) {
    // outer casing (brick red/brown)
    g.rect(x, y, 28, 24).fill(0x6e4334)
    g.rect(x + 2, y + 2, 24, 20).fill(0x4c2b20)
    // steel door
    g.rect(x + 6, y + 10, 16, 11).fill(0x282326)
    // burning furnace window (orange/yellow fire)
    g.rect(x + 9, y + 13, 10, 5).fill(0xe07a3c)
    g.rect(x + 11, y + 14, 6, 3).fill(0xffd76b)
  }

  function buildFactoryCog() {
    const root = new Container()
    const cog = new Graphics()
    // outer wheel body
    cog.circle(0, 0, 22).fill(0x7a6a58)
    // cog teeth
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i
      const tx = Math.cos(angle) * 23
      const ty = Math.sin(angle) * 23
      cog.rect(tx - 4, ty - 4, 8, 8).fill(0x7a6a58)
    }
    // inner hub cutout
    cog.circle(0, 0, 11).fill(0x1a1619)
    cog.circle(0, 0, 3).fill(0x7a6a58)
    root.addChild(cog)
    root.x = 110
    root.y = 150
    return { root, cog }
  }

  // ── MAGIC (arcane sanctum) ──────────────────────────────────────────────────
  const TOWER_SPOTS: [number, number][] = [
    [30, 270], [160, 280], [90, 250], [130, 220], [60, 190], [170, 180]
  ]
  const visibleTowers = (c: number) => Math.max(1, Math.min(c, TOWER_SPOTS.length))
  function drawMagic(g: Graphics, towers: number) {
    g.clear()
    const sky = [0x150b24, 0x1d1033, 0x271642, 0x331c54, 0x3e2366]
    for (let i = 0; i < sky.length; i++) g.rect(0, i * 40, W, 42).fill(sky[i])

    g.rect(0, 200, W, H - 200).fill(0x180d26)
    g.rect(0, 200, W, 8).fill(0x2d1847)

    for (const [cx, cy, cw] of [[15, 320, 8], [200, 310, 10], [90, 330, 12]] as [number, number, number][]) {
      g.poly([cx - cw, cy, cx + cw, cy, cx, cy - 24]).fill(0x8e4ec2)
      g.poly([cx - cw / 2, cy, cx + cw / 2, cy, cx, cy - 18]).fill(0xb36beb)
    }

    const activeTowers = visibleTowers(towers)
    for (let i = 0; i < activeTowers; i++) {
      drawTower(g, TOWER_SPOTS[i][0], TOWER_SPOTS[i][1])
    }
  }
  function drawTower(g: Graphics, x: number, y: number) {
    g.rect(x, y, 22, 40).fill(0x3e2e4f)
    g.rect(x + 18, y, 4, 40).fill(0x2b1e36)
    g.poly([x - 3, y, x + 11, y - 18, x + 25, y]).fill(0x9b54d6)
    g.rect(x + 8, y + 10, 6, 8).fill(0xffd76b)
  }

  // ── SPACE (orbital expansion) ──────────────────────────────────────────────
  const SAT_SPOTS: [number, number][] = [
    [40, 60], [160, 90], [100, 140], [50, 190], [150, 240], [90, 290]
  ]
  const visibleSats = (c: number) => Math.max(1, Math.min(c, SAT_SPOTS.length))
  function drawSpace(g: Graphics, sats: number) {
    g.clear()
    const sky = [0x050e14, 0x081620, 0x0c202e, 0x112b3d, 0x16364c]
    for (let i = 0; i < sky.length; i++) g.rect(0, i * 40, W, 42).fill(sky[i])

    g.circle(180, 260, 48).fill(0x0c202e)
    g.circle(180, 260, 46).fill(0x16364c)
    g.ellipse(180, 260, 70, 12).fill({ color: 0x4ec0d4, alpha: 0.15 })

    const activeSats = visibleSats(sats)
    for (let i = 0; i < activeSats; i++) {
      drawProbe(g, SAT_SPOTS[i][0], SAT_SPOTS[i][1])
    }
  }
  function drawProbe(g: Graphics, x: number, y: number) {
    g.rect(x - 16, y - 2, 8, 4).fill(0x2273a3)
    g.rect(x + 8, y - 2, 8, 4).fill(0x2273a3)
    g.circle(x, y, 4).fill(0xd4a843)
    g.rect(x - 1, y + 4, 2, 5).fill(0xece3d0)
  }

  // ── MINE (underground) ───────────────────────────────────────────────────────
  const visibleVeins = (c: number) => Math.min(c, 8)
  // stable gem placements (x, y, color) — avoid the support beams at x≈30/186
  const GEM_SPOTS: [number, number, number][] = [
    [56, 96, 0x9b7fd4], [120, 84, 0x4ec0d4], [150, 130, 0xd65a9e], [78, 150, 0xe0b84a],
    [104, 110, 0x9b7fd4], [140, 168, 0x4ec0d4], [64, 196, 0xd65a9e], [158, 210, 0xe0b84a],
    [92, 232, 0x9b7fd4], [128, 250, 0x4ec0d4], [70, 272, 0xd65a9e], [150, 290, 0xe0b84a],
    [100, 308, 0x9b7fd4], [60, 132, 0x4ec0d4], [160, 96, 0xd65a9e], [110, 188, 0xe0b84a],
    [84, 330, 0x9b7fd4], [144, 320, 0x4ec0d4], [72, 232, 0xd65a9e], [120, 150, 0xe0b84a],
    [52, 290, 0x9b7fd4], [166, 252, 0x4ec0d4], [96, 270, 0xd65a9e], [134, 110, 0xe0b84a],
  ]
  function drawMine(g: Graphics, veins: number) {
    g.clear()
    const rock = [0x2a2436, 0x322a40, 0x3a3048, 0x322a40, 0x2a2436, 0x342c42, 0x2e2740, 0x36304a]
    for (let i = 0; i < 8; i++) g.rect(0, i * 52, W, 54).fill(rock[i])
    g.rect(60, 0, 2, H).fill({ color: 0x000000, alpha: 0.22 })
    g.rect(150, 0, 2, H).fill({ color: 0x000000, alpha: 0.16 })
    // stalactites
    for (const sx of [20, 55, 95, 135, 175, 205]) g.poly([sx - 5, 0, sx + 5, 0, sx, 16]).fill(0x221c2e)
    // support frames
    for (const fx of [28, 184]) { g.rect(fx, 36, 8, H - 36).fill(0x5a3f28); g.rect(fx - 2, 36, 12, 8).fill(0x6a4a30) }
    g.rect(24, 36, W - 48, 8).fill(0x5a3f28)
    // gem veins (grow with level)
    const gems = Math.min(veins * 3, GEM_SPOTS.length)
    for (let i = 0; i < gems; i++) {
      const [x, y, c] = GEM_SPOTS[i]
      g.rect(x - 3, y - 1, 8, 3).fill({ color: c, alpha: 0.18 }) // ore halo
      g.rect(x, y, 3, 3).fill(c)
      g.rect(x, y, 1, 1).fill({ color: 0xffffff, alpha: 0.7 })
    }
    // rails + minecart at the bottom gallery
    g.rect(0, 360, W, 4).fill(0x241c10)
    g.rect(14, 358, W - 28, 2).fill(0x7a7a82)
    g.rect(90, 342, 34, 16).fill(0x44444e); g.rect(90, 342, 34, 4).fill(0x55555f)
    g.circle(98, 360, 4).fill(0x1e1e26); g.circle(116, 360, 4).fill(0x1e1e26)
    g.rect(94, 336, 8, 8).fill(0x8a7a5a); g.rect(106, 338, 8, 6).fill(0x9b7fd4)
    // rubble
    for (const [rx, ry, rw] of [[18, 352, 8], [200, 350, 7], [150, 356, 6]] as [number, number, number][]) {
      g.rect(rx, ry, rw, 5).fill(0x3a3142)
    }
  }
  // two wall torches; their glow halos flicker in the ticker
  function buildTorches(glowLayer: Container) {
    for (const [tx, ty] of [[44, 120], [172, 150]] as [number, number][]) {
      const stick = new Graphics()
      stick.rect(tx, ty, 3, 14).fill(0x5a3f28)         // handle
      stick.poly([tx - 2, ty, tx + 5, ty, tx + 1.5, ty - 8]).fill(0xff8a2a) // flame
      stick.poly([tx - 1, ty - 1, tx + 4, ty - 1, tx + 1.5, ty - 6]).fill(0xffd76b)
      app!.stage.addChild(stick)
      const glow = new Graphics()
      glow.circle(tx + 1.5, ty - 4, 26).fill({ color: 0xffb04a, alpha: 0.16 })
      glowLayer.addChild(glow)
      flickers.push({ g: glow, base: 0.16, phase: Math.random() * 6.28 })
    }
  }

  function buildCloud(alpha: number): Container {
    const c = new Container()
    for (const [px, py, r] of [[0, 0, 12], [14, 2, 16], [30, 0, 13], [20, -6, 10]] as [number, number, number][]) {
      const g = new Graphics()
      g.ellipse(px, py, r, r * 0.6).fill({ color: isFarm ? 0xffffff : 0xc9d2e8, alpha })
      c.addChild(g)
    }
    return c
  }
  function buildStars(layer: Container) {
    for (let i = 0; i < 9; i++) {
      const g = new Graphics()
      g.circle(0, 0, Math.random() < 0.3 ? 1.4 : 1).fill(0xffffff)
      g.x = 8 + Math.random() * (W - 16); g.y = 8 + Math.random() * 150
      layer.addChild(g)
      stars.push({ g, base: 0.5 + Math.random() * 0.4, speed: 1 + Math.random() * 2, phase: Math.random() * 6.28 })
    }
  }

  function buildMagicCrystal() {
    const root = new Container()
    const pedestal = new Graphics()
    // Pedestal at the center bottom
    pedestal.rect(98, 260, 24, 40).fill(0x2d1847)
    pedestal.rect(102, 230, 16, 30).fill(0x3e2366)
    pedestal.poly([94, 230, 126, 230, 110, 218]).fill(0x522f85)
    root.addChild(pedestal)

    // Floating crystal container
    const crystalContainer = new Container()
    crystalContainer.x = 110
    crystalContainer.y = 170

    const crystal = new Graphics()
    crystal.poly([0, -22, 12, 0, 0, 22, -12, 0]).fill(0xd27dfa)
    crystal.poly([0, -22, 0, 22, -12, 0]).fill({ color: 0xe6b3ff, alpha: 0.5 })

    crystalContainer.addChild(crystal)
    root.addChild(crystalContainer)
    return { root, crystalContainer, crystal }
  }

  function buildSpaceStation() {
    const root = new Container()
    const station = new Container()
    station.x = 110
    station.y = 160

    const body = new Graphics()
    body.circle(0, 0, 12).fill(0x758a99)
    body.circle(0, 0, 7).fill(0x4d6270)

    const beacon = new Graphics()
    beacon.circle(0, 0, 3).fill(0x4ec0d4)

    const solarArms = new Container()
    for (let i = 0; i < 2; i++) {
      const arm = new Graphics()
      arm.rect(-38, -5, 26, 10).fill(0x2273a3)
      arm.rect(-12, -1.5, 12, 3).fill(0x56565e)
      arm.rect(12, -5, 26, 10).fill(0x2273a3)
      arm.rect(0, -1.5, 12, 3).fill(0x56565e)
      arm.rotation = i * Math.PI / 2
      solarArms.addChild(arm)
    }

    station.addChild(solarArms)
    station.addChild(body)
    station.addChild(beacon)
    root.addChild(station)

    return { root, solarArms, beacon }
  }

  function countFor(): number {
    if (isMine) return visibleVeins(getCount())
    if (isFarm) return visibleRows(getCount())
    if (isFactory) return visibleBoilers(getCount())
    if (isMagic) return visibleTowers(getCount())
    if (isSpace) return visibleSats(getCount())
    return visibleHouses(getCount())
  }
  function drawScene(g: Graphics, n: number) {
    if (isMine) drawMine(g, n)
    else if (isFarm) drawFarm(g, n)
    else if (isFactory) drawFactory(g, n)
    else if (isMagic) drawMagic(g, n)
    else if (isSpace) drawSpace(g, n)
    else drawVillage(g, n)
  }

  async function initPixi() {
    app = new Application()
    await app.init({
      canvas: canvasEl, width: W, height: H,
      backgroundColor: isMine ? 0x2a2436 : isFarm ? 0x355a86 : isFactory ? 0x1a1619 : isMagic ? 0x1c1224 : isSpace ? 0x0c1b20 : 0x0a0a1e,
      resolution: window.devicePixelRatio || 1, autoDensity: true, antialias: false,
    })

    const bg = new Graphics()
    let count = countFor()
    drawScene(bg, count)
    app.stage.addChild(bg)

    let windmill: ReturnType<typeof buildWindmill> | null = null
    let factoryCog: ReturnType<typeof buildFactoryCog> | null = null
    let magicCrystal: ReturnType<typeof buildMagicCrystal> | null = null
    let spaceStation: ReturnType<typeof buildSpaceStation> | null = null
    const glowLayer = new Container()
    if (isMine) { app.stage.addChild(glowLayer); buildTorches(glowLayer) }
    else if (isFarm) { windmill = buildWindmill(); app.stage.addChild(windmill.root) }
    else if (isFactory) { factoryCog = buildFactoryCog(); app.stage.addChild(factoryCog.root) }
    else if (isMagic) { magicCrystal = buildMagicCrystal(); app.stage.addChild(magicCrystal.root) }
    else if (isSpace) { spaceStation = buildSpaceStation(); app.stage.addChild(spaceStation.root) }

    if (stageId === 'village' || isMagic || isSpace) {
      const sl = new Container(); app.stage.addChild(sl); buildStars(sl)
    }

    // clouds only above ground (no mine, no factory, no space)
    if (!isMine && !isFactory && !isSpace) {
      const cA = buildCloud(isFarm ? 0.55 : 0.10); cA.x = 40; cA.y = isFarm ? 50 : 70; app.stage.addChild(cA)
      const cB = buildCloud(isFarm ? 0.4 : 0.08); cB.x = 150; cB.y = isFarm ? 90 : 110; app.stage.addChild(cB)
      cloudRefs = [cA, cB]
    }

    const partLayer = new Container(); app.stage.addChild(partLayer)
    const popLayer = new Container(); app.stage.addChild(popLayer)

    let elapsed = 0, spawnTimer = 0, popTimer = 0
    let lastAmount = getAmount()

    app.ticker.add((ticker: Ticker) => {
      const dt = ticker.deltaMS / 1000
      elapsed += dt

      const n = countFor()
      if (n !== count) { count = n; drawScene(bg, count) }

      for (const c of cloudRefs) { c.x += dt * (isFarm ? 8 : 5); if (c.x > W + 40) c.x = -50 }

      if (isMine) {
        // torch flicker
        for (const f of flickers) f.g.alpha = f.base + Math.sin(elapsed * 9 + f.phase) * 0.05 + Math.sin(elapsed * 23 + f.phase) * 0.03
        // falling dust motes
        spawnTimer += dt
        if (spawnTimer > 0.5 && particles.length < 12) {
          spawnTimer = 0
          const g = new Graphics(); g.circle(0, 0, 1).fill({ color: 0xb0a0c0, alpha: 0.5 })
          g.x = 16 + Math.random() * (W - 32); g.y = 20
          partLayer.addChild(g); particles.push({ g, life: 3, max: 3 })
        }
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]; p.life -= dt
          if (p.life <= 0) { partLayer.removeChild(p.g); p.g.destroy(); particles.splice(i, 1); continue }
          p.g.y += dt * 12; p.g.x += Math.sin(elapsed + i) * 0.15; p.g.alpha = (p.life / p.max) * 0.5
        }
      } else if (isFactory && factoryCog) {
        factoryCog.cog.rotation += dt * 1.2
        // rising sparks (particles)
        spawnTimer += dt
        if (spawnTimer > 0.4 && particles.length < 15) {
          spawnTimer = 0
          const g = new Graphics(); g.circle(0, 0, 1.5).fill({ color: 0xffa044, alpha: 0.8 })
          g.x = 16 + Math.random() * (W - 32); g.y = H - 20
          partLayer.addChild(g); particles.push({ g, life: 2.0, max: 2.0 })
        }
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]; p.life -= dt
          if (p.life <= 0) { partLayer.removeChild(p.g); p.g.destroy(); particles.splice(i, 1); continue }
          p.g.y -= dt * 30; p.g.x += (Math.random() - 0.5) * 20 * dt; p.g.alpha = (p.life / p.max) * 0.8
        }
      } else if (isFarm && windmill) {
        windmill.blades.rotation += dt * 0.9
      } else if (isMagic && magicCrystal) {
        // floating & bobbing magic crystal
        magicCrystal.crystalContainer.y = 170 + Math.sin(elapsed * 2.5) * 6
        magicCrystal.crystal.rotation += dt * 0.5
        const scaleVal = 1 + Math.sin(elapsed * 4) * 0.08
        magicCrystal.crystal.scale.set(scaleVal)

        // stars twinkle
        for (const s of stars) s.g.alpha = s.base + Math.sin(elapsed * s.speed + s.phase) * 0.35

        // violet sparks rising
        spawnTimer += dt
        if (spawnTimer > 0.35 && particles.length < 18) {
          spawnTimer = 0
          const g = new Graphics()
          g.circle(0, 0, Math.random() < 0.5 ? 2 : 1).fill({ color: 0xd27dfa, alpha: 0.8 })
          g.x = 90 + Math.random() * 40
          g.y = 200 + Math.random() * 20
          partLayer.addChild(g)
          particles.push({ g, life: 1.8, max: 1.8 })
        }
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]; p.life -= dt
          if (p.life <= 0) { partLayer.removeChild(p.g); p.g.destroy(); particles.splice(i, 1); continue }
          p.g.y -= dt * 22
          p.g.x += Math.sin(elapsed * 5 + i) * dt * 8
          p.g.alpha = (p.life / p.max) * 0.8
        }
      } else if (isSpace && spaceStation) {
        // rotating station arrays
        spaceStation.solarArms.rotation += dt * 0.4
        // flashing beacon light
        spaceStation.beacon.alpha = 0.3 + Math.abs(Math.sin(elapsed * 6)) * 0.7

        // stars twinkle
        for (const s of stars) s.g.alpha = s.base + Math.sin(elapsed * s.speed + s.phase) * 0.35

        // teal cosmic dust drifting
        spawnTimer += dt
        if (spawnTimer > 0.45 && particles.length < 15) {
          spawnTimer = 0
          const g = new Graphics()
          g.circle(0, 0, Math.random() < 0.5 ? 1.5 : 1).fill({ color: 0x4ec0d4, alpha: 0.7 })
          g.x = Math.random() * W
          g.y = Math.random() < 0.5 ? 0 : Math.random() * H
          partLayer.addChild(g)
          particles.push({ g, life: 4.0, max: 4.0 })
        }
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]; p.life -= dt
          if (p.life <= 0) { partLayer.removeChild(p.g); p.g.destroy(); particles.splice(i, 1); continue }
          p.g.x -= dt * 7
          p.g.y += Math.sin(elapsed * 0.5 + i) * dt * 3
          p.g.alpha = (p.life / p.max) * 0.7
        }
      } else {
        for (const s of stars) s.g.alpha = s.base + Math.sin(elapsed * s.speed + s.phase) * 0.35
        spawnTimer += dt
        if (spawnTimer > 0.55 && particles.length < 14) {
          spawnTimer = 0
          const h = HOUSES[Math.floor(Math.random() * Math.min(count, 4))]
          const g = new Graphics(); g.circle(0, 0, 2).fill({ color: 0xcfd6e0, alpha: 0.30 })
          g.x = h[0] + 19; g.y = h[1] - 12
          partLayer.addChild(g); particles.push({ g, life: 2.2, max: 2.2 })
        }
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i]; p.life -= dt
          if (p.life <= 0) { partLayer.removeChild(p.g); p.g.destroy(); particles.splice(i, 1); continue }
          p.g.y -= dt * 10; p.g.alpha = (p.life / p.max) * 0.3; p.g.scale.set(1 + (p.max - p.life) * 0.5)
        }
      }

      // number-pops — spawn at most one Text per 0.7s, then update in place each frame.
      popTimer += dt
      const cur = getAmount(); const delta = cur - lastAmount; lastAmount = cur
      if (delta > 0.01 && popTimer > 0.7) {
        popTimer = 0
        const px = 60 + Math.random() * 100
        const py = (isMine ? 200 : 240) + Math.random() * 40
        const t = new Text({ text: '+' + fmt(delta), style: popStyle })
        t.x = px; t.y = py
        popLayer.addChild(t)
        pops.push({ t, x: px, y: py, life: 1.4, vx: (Math.random() - 0.5) * 16, vy: -34 })
      }
      for (let i = pops.length - 1; i >= 0; i--) {
        const p = pops[i]
        p.life -= dt
        if (p.life <= 0) { popLayer.removeChild(p.t); p.t.destroy(); pops.splice(i, 1); continue }
        p.x += p.vx * dt; p.y += p.vy * dt
        p.t.x = p.x; p.t.y = p.y; p.t.alpha = Math.max(0, p.life / 1.4)
      }
    })
  }

  let cloudRefs: Container[] = []
  onMount(() => { initPixi() })
  onDestroy(() => {
    // The canvas is keyed on stageId (GameLayout), so it remounts on every stage switch.
    // Destroy the stage's children + their GPU textures too, or they leak per switch.
    // removeView:false — Svelte owns the <canvas> element and unmounts it itself.
    app?.destroy(false, { children: true, texture: true })
    app = null
    pops = []; particles = []; stars = []; flickers = []; cloudRefs = []
  })
</script>

<canvas bind:this={canvasEl} class="pixi-canvas"></canvas>

<style>
  .pixi-canvas {
    display: block;
    width: 220px;
    height: 400px;
    image-rendering: pixelated;
    border-radius: 4px;
    box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5);
  }
</style>
