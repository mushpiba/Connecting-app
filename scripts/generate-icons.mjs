/**
 * PWA 아이콘을 픽셀로 그려 PNG로 저장한다. 일회성 스크립트다.
 *
 * 이미지 라이브러리를 붙이지 않는 이유는 아이콘 하나 만들자고 빌드 의존성을
 * 늘릴 필요가 없어서다. zlib은 Node에 이미 있다.
 *
 * 실행: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const NAVY = [11, 41, 68]
const TEAL = [39, 179, 177]

/** 심전도 모양 꺾은선. 0~1 좌표계. */
const WAVE = [
  [0.08, 0.6],
  [0.28, 0.6],
  [0.36, 0.33],
  [0.44, 0.78],
  [0.52, 0.28],
  [0.6, 0.6],
  [0.92, 0.6],
]

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

function roundedBoxDistance(px, py, size, radius) {
  const half = size / 2
  const qx = Math.abs(px - half) - (half - radius)
  const qy = Math.abs(py - half) - (half - radius)
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0))
  return outside + Math.min(Math.max(qx, qy), 0) - radius
}

function coverage(distance) {
  return Math.max(0, Math.min(1, 0.5 - distance))
}

function blend(base, top, alpha) {
  return base.map((channel, index) => Math.round(channel * (1 - alpha) + top[index] * alpha))
}

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function toPng(size, pixels) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size, 0)
  header.writeUInt32BE(size, 4)
  header[8] = 8
  header[9] = 6
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** maskable은 마스크에 잘리므로 모서리를 둥글리지 않고 내용만 안쪽으로 넣는다. */
function drawIcon(size, { maskable }) {
  const radius = maskable ? 0 : size * 0.22
  const inset = maskable ? 0.18 : 0
  const scale = 1 - inset * 2
  const strokeHalf = size * (maskable ? 0.05 : 0.062)
  const pixels = Buffer.alloc(size * size * 4)

  const points = WAVE.map(([x, y]) => [(inset + x * scale) * size, (inset + y * scale) * size])

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = x + 0.5
      const py = y + 0.5

      const boxAlpha = maskable ? 1 : coverage(roundedBoxDistance(px, py, size, radius))
      if (boxAlpha <= 0) continue

      let waveDistance = Infinity
      for (let index = 0; index < points.length - 1; index += 1) {
        const [ax, ay] = points[index]
        const [bx, by] = points[index + 1]
        waveDistance = Math.min(waveDistance, distanceToSegment(px, py, ax, ay, bx, by))
      }
      const waveAlpha = coverage(waveDistance - strokeHalf)
      const color = waveAlpha > 0 ? blend(NAVY, TEAL, waveAlpha) : NAVY

      const offset = (y * size + x) * 4
      pixels[offset] = color[0]
      pixels[offset + 1] = color[1]
      pixels[offset + 2] = color[2]
      pixels[offset + 3] = Math.round(boxAlpha * 255)
    }
  }

  return toPng(size, pixels)
}

const targets = [
  ['public/icon-192.png', 192, { maskable: false }],
  ['public/icon-512.png', 512, { maskable: false }],
  ['public/icon-maskable-512.png', 512, { maskable: true }],
]

for (const [path, size, options] of targets) {
  writeFileSync(path, drawIcon(size, options))
  console.log(`wrote ${path}`)
}
