import { useRef, useEffect } from 'react'
import { SHAPES, SEQUENCE, DOT_COUNT } from './dots'

const HOLD_S  = 0.6
const MORPH_S = 1.2
const FRAME_S = HOLD_S + MORPH_S

const DOT_PX = 6
const DOT_R  = 2.4
const DW = 630
const DH = 360

// cubic-bezier(0.76, 0, 0.24, 1) approximated via quintic ease-in-out
function ease(t: number) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2
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
    let lastFi = -1
    let fromIdx = 0
    let toIdx = 1

    function setSize() {
      const dpr = window.devicePixelRatio || 1
      const mobile = window.innerWidth <= 640
      const maxW = mobile ? 300 : DW
      const maxH = mobile ? 200 : DH
      const scale = Math.min(maxW / DW, maxH / DH, window.innerWidth / DW, window.innerHeight / DH)
      const cssW = Math.round(DW * scale)
      const cssH = Math.round(DH * scale)
      canvas.style.width  = cssW + 'px'
      canvas.style.height = cssH + 'px'
      canvas.width  = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
    }

    function draw(ts: number) {
      if (startTime === null) startTime = ts
      const elapsed = (ts - startTime) / 1000
      const fi = Math.floor(elapsed / FRAME_S)
      const ft = (elapsed % FRAME_S) / FRAME_S

      if (fi !== lastFi) {
        lastFi = fi
        fromIdx = fi === 0 ? Math.floor(Math.random() * shapes.length) : toIdx
        do { toIdx = Math.floor(Math.random() * shapes.length) } while (toIdx === fromIdx)
      }

      const from = shapes[fromIdx]
      const to   = shapes[toIdx]

      const holdFrac = HOLD_S / FRAME_S
      const morphT = ft <= holdFrac
        ? 0
        : ease((ft - holdFrac) / (1 - holdFrac))

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
