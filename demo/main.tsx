import { createRoot } from 'react-dom/client'
import { useRef, useEffect, useCallback } from 'react'
import { LiquidGlassCard, LiquidGlassPill } from 'react-liquid-glass'

// ---------------------------------------------------------------------------
// HSL → Hex helper
// ---------------------------------------------------------------------------
function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// ---------------------------------------------------------------------------
// Particle + Trail config
// ---------------------------------------------------------------------------
const PARTICLE_COUNT = 80
const TRAIL_SEGMENTS = 10
const TRAIL_SPRING_STIFFNESS = 150
const TRAIL_SPRING_DAMPING = 20
const ATTRACT_RADIUS = 0.6

const HUE_ANCHORS = [
  200, 210, 215, 220, 225, 230, 240, 250, 260, 270, 280, 290, 180, 190, 30, 40, 0, 350,
]

interface Particle {
  baseX: number; baseY: number; size: number; rotation: number
  driftPhaseX: number; driftPhaseY: number; driftSpeedX: number; driftSpeedY: number
  driftAmplitudeX: number; driftAmplitudeY: number; attractStrength: number
  baseOpacity: number; hueBase: number; hueSpeed: number; saturation: number; lightness: number
}

interface TrailPoint { x: number; y: number; vx: number; vy: number }

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => ({
    baseX: Math.random(), baseY: Math.random(),
    size: 3 + Math.random() * 6, rotation: Math.random() * 360,
    driftPhaseX: Math.random() * Math.PI * 2, driftPhaseY: Math.random() * Math.PI * 2,
    driftSpeedX: 0.2 + Math.random() * 0.5, driftSpeedY: 0.2 + Math.random() * 0.5,
    driftAmplitudeX: 30 + Math.random() * 60, driftAmplitudeY: 30 + Math.random() * 60,
    attractStrength: 0.25 + Math.random() * 0.35,
    baseOpacity: 0.2 + Math.random() * 0.25,
    hueBase: HUE_ANCHORS[Math.floor(Math.random() * HUE_ANCHORS.length)] + (Math.random() - 0.5) * 30,
    hueSpeed: 8 + Math.random() * 25,
    saturation: 50 + Math.random() * 35, lightness: 38 + Math.random() * 22,
  }))
}

const particles = generateParticles()

// ---------------------------------------------------------------------------
// AuroraDemo — the full background with particles, trail, and glow
// ---------------------------------------------------------------------------
function AuroraDemo({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const particleRefs = useRef<(HTMLDivElement | null)[]>([])
  const trailRefs = useRef<(HTMLDivElement | null)[]>([])
  const cursorRef = useRef({ x: 0.5, y: 0.5 })
  const cursorPxRef = useRef({ x: 0, y: 0 })
  const smoothCursorRef = useRef({ x: 0.5, y: 0.5 })
  const rafRef = useRef<number>(0)
  const timeRef = useRef(0)
  const glowHueRef = useRef(210)

  const trailPointsRef = useRef<TrailPoint[]>(
    Array.from({ length: TRAIL_SEGMENTS }, () => ({ x: 0, y: 0, vx: 0, vy: 0 }))
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      cursorRef.current = { x, y }
      cursorPxRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const tick = useCallback(() => {
    const dt = 0.016
    timeRef.current += dt
    const t = timeRef.current

    const lerp = 0.07
    smoothCursorRef.current.x += (cursorRef.current.x - smoothCursorRef.current.x) * lerp
    smoothCursorRef.current.y += (cursorRef.current.y - smoothCursorRef.current.y) * lerp
    const cx = smoothCursorRef.current.x
    const cy = smoothCursorRef.current.y

    // --- Cursor glow ---
    const glow = glowRef.current
    if (glow) {
      glowHueRef.current = 210 + Math.sin(t * 0.4) * 25
      const h = glowHueRef.current
      glow.style.background = `radial-gradient(700px circle at ${cx * 100}% ${cy * 100}%, hsla(${h}, 65%, 55%, 0.15) 0%, hsla(${h}, 55%, 45%, 0.06) 40%, transparent 70%)`
    }

    // --- Trail: spring-physics chain ---
    const trail = trailPointsRef.current
    const target = cursorPxRef.current

    for (let i = 0; i < TRAIL_SEGMENTS; i++) {
      const point = trail[i]
      const leader = i === 0 ? target : trail[i - 1]
      const dx = point.x - leader.x
      const dy = point.y - leader.y
      const fx = -TRAIL_SPRING_STIFFNESS * dx - TRAIL_SPRING_DAMPING * point.vx
      const fy = -TRAIL_SPRING_STIFFNESS * dy - TRAIL_SPRING_DAMPING * point.vy
      point.vx += fx * dt
      point.vy += fy * dt
      point.x += point.vx * dt
      point.y += point.vy * dt
    }

    for (let i = 0; i < TRAIL_SEGMENTS; i++) {
      const el = trailRefs.current[i]
      if (!el) continue
      const point = trail[i]
      const leader = i === 0 ? target : trail[i - 1]
      const tdx = point.x - leader.x
      const tdy = point.y - leader.y
      const angle = Math.atan2(tdy, tdx) * (180 / Math.PI)
      const segDist = Math.sqrt(tdx * tdx + tdy * tdy)
      const len = Math.min(20 + segDist * 0.8, 60)
      const breathPhase = t * 3.5 + i * 0.7
      const breathFactor = 0.5 + 0.5 * Math.sin(breathPhase)
      const height = 2 + breathFactor * 3.5
      const opacity = 0.12 + breathFactor * 0.22 - i * 0.025
      const segHue = 210 + i * 12 + t * 15
      const color = hslToHex(segHue, 60 + breathFactor * 20, 48 + breathFactor * 12)
      const mx = (point.x + leader.x) / 2
      const my = (point.y + leader.y) / 2
      el.style.transform = `translate(${mx - len / 2}px, ${my - height / 2}px) rotate(${angle}deg)`
      el.style.width = `${len}px`
      el.style.height = `${height}px`
      el.style.opacity = String(Math.max(opacity, 0))
      el.style.backgroundColor = color
    }

    // --- Particles ---
    for (let i = 0; i < particles.length; i++) {
      const el = particleRefs.current[i]
      if (!el) continue
      const p = particles[i]
      const driftX = Math.sin(t * p.driftSpeedX + p.driftPhaseX) * p.driftAmplitudeX
      const driftY = Math.cos(t * p.driftSpeedY + p.driftPhaseY) * p.driftAmplitudeY
      const rot = p.rotation + t * 8
      const pdx = cx - p.baseX
      const pdy = cy - p.baseY
      const dist = Math.sqrt(pdx * pdx + pdy * pdy)
      const attractFactor = Math.max(0, 1 - dist / ATTRACT_RADIUS)
      const eased = attractFactor * attractFactor * attractFactor
      const pullX = pdx * eased * p.attractStrength * 1200
      const pullY = pdy * eased * p.attractStrength * 1200
      const opacity = p.baseOpacity + eased * 0.5
      const currentHue = p.hueBase + t * p.hueSpeed
      const color = hslToHex(currentHue, p.saturation, p.lightness)
      el.style.transform = `translate(${driftX + pullX}px, ${driftY + pullY}px) rotate(${rot}deg)`
      el.style.opacity = String(Math.min(opacity, 0.75))
      el.style.backgroundColor = color
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick])

  return (
    <div ref={containerRef} style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden', background: '#F8FAFC' }}>
      {/* Cursor glow */}
      <div ref={glowRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* Particles */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {particles.map((p, i) => (
          <div
            key={i}
            ref={(el) => { particleRefs.current[i] = el }}
            style={{
              position: 'absolute',
              left: `${p.baseX * 100}%`,
              top: `${p.baseY * 100}%`,
              width: `${p.size * 2.2}px`,
              height: `${p.size * 0.5}px`,
              borderRadius: '2px',
              backgroundColor: hslToHex(p.hueBase, p.saturation, p.lightness),
              opacity: p.baseOpacity,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </div>

      {/* Trail */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {Array.from({ length: TRAIL_SEGMENTS }, (_, i) => (
          <div
            key={`trail-${i}`}
            ref={(el) => { trailRefs.current[i] = el }}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '20px', height: '3px', borderRadius: '2px',
              backgroundColor: hslToHex(210 + i * 12, 65, 50),
              opacity: 0, willChange: 'transform, opacity, width, height',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
function App() {
  return (
    <AuroraDemo>
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', padding: '48px 24px', gap: '40px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Title */}
        <h1 style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(100,116,139,0.8)' }}>
          anam-react-liquid-glass
        </h1>

        {/* Card demo */}
        <LiquidGlassCard style={{ padding: '40px 48px', maxWidth: '420px', width: '100%' }} borderRadius="28px">
          <h2 style={{ margin: '0 0 12px', fontSize: '22px', fontWeight: 700, color: '#1a1a2e', letterSpacing: '-0.02em' }}>
            LiquidGlassCard
          </h2>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6, color: '#3a3a5c' }}>
            Frosted glass with cursor-reactive specular highlights, 3D tilt, and rim lighting. Move your mouse over the card.
          </p>
        </LiquidGlassCard>

        {/* Pill button */}
        <LiquidGlassPill onClick={() => alert('Clicked!')} style={{ padding: '16px 40px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(71,85,105,0.95)', letterSpacing: '-0.01em' }}>
            LiquidGlassPill — Click me
          </span>
        </LiquidGlassPill>

        {/* Pill nav bar */}
        <LiquidGlassPill borderRadius="20px" style={{ padding: '12px 32px', display: 'flex', gap: '32px' }}>
          {['Home', 'About', 'Work', 'Contact'].map((label) => (
            <span key={label} style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(71,85,105,0.85)' }}>
              {label}
            </span>
          ))}
        </LiquidGlassPill>
      </div>
    </AuroraDemo>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
