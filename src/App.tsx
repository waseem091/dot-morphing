import { useRef, useEffect } from 'react'
import { SHAPES, SEQUENCE, DOT_COUNT } from './dots'

const HOLD_S = 0.6
const MORPH_S = 1.0
const FRAME_S = HOLD_S + MORPH_S // 1.6s total per shape

const DOT_PX = 6
const DOT_R  = 2.4
const DW = 630
const DH = 360

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.fill()
}

const shapes = SEQUENCE.map(name => SHAPES[name])

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    let rafId: number
    let startTime: number | null = null

    function setSize() {
      const mobile = window.innerWidth <= 640
      const maxW = mobile ? 300 : DW
      const maxH = mobile ? 200 : DH
      const scale = Math.min(maxW / DW, maxH / DH, window.innerWidth / DW, window.innerHeight / DH)
      canvas.width  = Math.round(DW * scale)
      canvas.height = Math.round(DH * scale)
    }

    function draw(ts: number) {
      if (startTime === null) startTime = ts
      const elapsed = (ts - startTime) / 1000
      const cycle = FRAME_S * shapes.length
      const t = elapsed % cycle

      const fi = Math.floor(t / FRAME_S)
      const ft = (t % FRAME_S) / FRAME_S

      const from = shapes[fi % shapes.length]
      const to   = shapes[(fi + 1) % shapes.length]

      const holdFrac = HOLD_S / FRAME_S
      const morphT = ft <= holdFrac
        ? 0
        : easeInOutCubic((ft - holdFrac) / (1 - holdFrac))

      const scale = canvas.width / DW
      const s = DOT_PX * scale
      const r = DOT_R  * scale

      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#2244ff'

      for (let i = 0; i < DOT_COUNT; i++) {
        const x = (from[i][0] + (to[i][0] - from[i][0]) * morphT) * scale
        const y = (from[i][1] + (to[i][1] - from[i][1]) * morphT) * scale
        roundRect(ctx, x, y, s, s, r)
      }

      rafId = requestAnimationFrame(draw)
    }

    setSize()
    window.addEventListener('resize', setSize)
    rafId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', setSize)
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} />
    </div>
  )
}
