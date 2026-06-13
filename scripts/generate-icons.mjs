/**
 * Pure-Node PNG icon generator — no native dependencies.
 * Draws the brass "Fortune Engine" cog on deep ink, with a glowing core.
 * Produces the PWA icon set into /public.
 *
 *   node scripts/generate-icons.mjs
 */
import zlib from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public')
mkdirSync(OUT, { recursive: true })

// ── colors (RGBA) ────────────────────────────────────────────────────────────
const BG       = [10, 8, 18, 255]
const BG_GLOW  = [28, 22, 46, 255]
const BRASS    = [212, 168, 67, 255]
const BRASS_HI = [255, 215, 107, 255]
const BRASS_LO = [138, 109, 42, 255]

function lerp(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)) }

// ── minimal PNG encoder ──────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0 // 8-bit RGBA
  const raw = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0 // filter: none
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4)
  }
  const idat = zlib.deflateSync(raw, { level: 9 })
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))])
}

// ── draw the cog ─────────────────────────────────────────────────────────────
function drawIcon(size, pad = 0) {
  const rgba = Buffer.alloc(size * size * 4)
  const cx = size / 2, cy = size / 2
  const half = (size / 2) * (1 - pad)
  const TEETH = 8
  const toothR = half * 0.90
  const bodyR  = half * 0.70
  const holeR  = half * 0.30
  const coreR  = half * 0.15

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx + 0.5, dy = y - cy + 0.5
      const r = Math.hypot(dx, dy)
      const ang = Math.atan2(dy, dx)
      // radial background vignette
      const vg = Math.min(1, r / (size * 0.6))
      let col = lerp(BG_GLOW, BG, vg)

      // gear outline radius for this angle (teeth)
      const a = ((ang + Math.PI) / (2 * Math.PI)) * TEETH
      const frac = a - Math.floor(a)
      const inTooth = frac > 0.28 && frac < 0.72
      const edge = inTooth ? toothR : bodyR

      if (r <= edge && r >= holeR) {
        // body with a soft top-light bevel
        const light = 0.5 + 0.5 * (-dy / half) // brighter toward top
        col = lerp(BRASS_LO, BRASS, Math.max(0, Math.min(1, light)))
        if (r > edge - size * 0.02) col = BRASS_LO            // outer rim shade
        if (r < holeR + size * 0.025) col = BRASS_LO          // inner rim shade
        if (light > 0.8 && r < bodyR) col = lerp(col, BRASS_HI, 0.5)
      }
      // glowing fortune core
      if (r < coreR) {
        const t = r / coreR
        col = lerp(BRASS_HI, BRASS, t)
      } else if (r < coreR + size * 0.02) {
        col = BRASS_LO
      }

      const i = (y * size + x) * 4
      rgba[i] = col[0]; rgba[i + 1] = col[1]; rgba[i + 2] = col[2]; rgba[i + 3] = 255
    }
  }
  return encodePNG(size, size, rgba)
}

const targets = [
  ['icon-192.png', 192, 0.04],
  ['icon-512.png', 512, 0.04],
  ['icon-512-maskable.png', 512, 0.18], // safe-zone padding for maskable
  ['apple-touch-icon.png', 180, 0.06],
  ['favicon-32.png', 32, 0.0],
]
for (const [name, size, pad] of targets) {
  writeFileSync(join(OUT, name), drawIcon(size, pad))
  console.log('wrote', name, `(${size}x${size})`)
}
console.log('done')
