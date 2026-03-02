import { useRef, useCallback, useEffect, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// LiquidGlassCard — iOS 26-inspired frosted glass with cursor-reactive shine
// ---------------------------------------------------------------------------
// Layers:
//   1. Backdrop blur + saturation boost (frosted glass base)
//   2. Specular highlight that tracks cursor across the card surface
//   3. Subtle 3D perspective tilt responding to cursor position
//   4. Animated rim light on edges
//   5. Top-edge highlight (light catching glass rim)
// ---------------------------------------------------------------------------

export interface LiquidGlassCardProps {
  children: React.ReactNode
  className?: string
  style?: CSSProperties
  /** Max tilt in degrees (default 2.5) */
  tiltMax?: number
  /** Specular highlight size in px (default 280) */
  shineSize?: number
  /** CSS border-radius (default '24px') */
  borderRadius?: string
}

const abs: CSSProperties = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  pointerEvents: 'none',
}

export function LiquidGlassCard({
  children,
  className,
  style,
  tiltMax = 2.5,
  shineSize = 280,
  borderRadius = '24px',
}: LiquidGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const shineRef = useRef<HTMLDivElement>(null)
  const rimRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const mouseRef = useRef({ x: 0.5, y: 0.5, inside: false })
  const smoothRef = useRef({ x: 0.5, y: 0.5 })

  const tick = useCallback(() => {
    const card = cardRef.current
    const shine = shineRef.current
    const rim = rimRef.current
    if (!card || !shine || !rim) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    const lerp = mouseRef.current.inside ? 0.08 : 0.04
    smoothRef.current.x += (mouseRef.current.x - smoothRef.current.x) * lerp
    smoothRef.current.y += (mouseRef.current.y - smoothRef.current.y) * lerp

    const sx = smoothRef.current.x
    const sy = smoothRef.current.y

    // 3D tilt
    const tiltX = (sy - 0.5) * -tiltMax
    const tiltY = (sx - 0.5) * tiltMax
    card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`

    // Specular highlight
    const shineX = sx * 100
    const shineY = sy * 100
    const shineOpacity = mouseRef.current.inside ? 1 : 0
    shine.style.background = `radial-gradient(${shineSize}px circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0) 70%)`
    shine.style.opacity = String(shineOpacity)

    // Rim light
    const rimAngle = Math.atan2(sy - 0.5, sx - 0.5) * (180 / Math.PI) + 90
    rim.style.background = `conic-gradient(from ${rimAngle}deg, rgba(255,255,255,0.5) 0deg, rgba(255,255,255,0.0) 60deg, rgba(255,255,255,0.0) 300deg, rgba(255,255,255,0.5) 360deg)`

    rafRef.current = requestAnimationFrame(tick)
  }, [tiltMax, shineSize])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick])

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        inside: true,
      }
    }

    const handleLeave = () => {
      mouseRef.current = { ...mouseRef.current, inside: false, x: 0.5, y: 0.5 }
    }

    card.addEventListener('mousemove', handleMove)
    card.addEventListener('mouseleave', handleLeave)
    return () => {
      card.removeEventListener('mousemove', handleMove)
      card.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.55)',
        backdropFilter: 'blur(24px) saturate(180%) brightness(105%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%) brightness(105%)',
        border: '1px solid rgba(255, 255, 255, 0.6)',
        borderRadius,
        boxShadow: `
          0 8px 32px rgba(27, 79, 114, 0.08),
          0 1px 3px rgba(0, 0, 0, 0.04),
          inset 0 1px 0 rgba(255, 255, 255, 0.8),
          inset 0 -1px 0 rgba(255, 255, 255, 0.3)
        `,
        willChange: 'transform',
        transition: 'box-shadow 0.3s ease',
        ...style,
      }}
    >
      {/* Rim light — conic gradient masked to border ring */}
      <div
        ref={rimRef}
        style={{
          ...abs,
          borderRadius: 'inherit',
          maskImage:
            'linear-gradient(black, black) content-box, linear-gradient(black, black)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor' as string,
          padding: '1px',
          opacity: 0.7,
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* Specular shine — radial gradient tracking cursor */}
      <div
        ref={shineRef}
        style={{
          ...abs,
          borderRadius: 'inherit',
          opacity: 0,
          transition: 'opacity 0.5s ease',
          mixBlendMode: 'soft-light',
        }}
      />

      {/* Top edge highlight */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          pointerEvents: 'none',
          background:
            'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.9) 50%, transparent 90%)',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>{children}</div>
    </div>
  )
}
