import { useRef, useCallback, useEffect, type CSSProperties } from 'react'

// ---------------------------------------------------------------------------
// LiquidGlassPill — TRUE iOS 26 liquid glass (ultra-translucent)
// ---------------------------------------------------------------------------
// Unlike LiquidGlassCard (frosted white, 55% opacity), this is genuinely
// translucent: background content bleeds through at ~10% opacity.
//
// Layers:
//   1. Ultra-sheer backdrop blur + saturate (glass base)
//   2. Cursor-tracking specular highlight (overlay blend)
//   3. Cursor-reactive inner refraction glow (shifts opposite to cursor)
//   4. Conic rim light following cursor angle
//   5. Static top-edge highlight (light catching glass)
//   6. Subtle chromatic tint at corners (prismatic edge)
//   7. 3D perspective tilt
// ---------------------------------------------------------------------------

export interface LiquidGlassPillProps {
  children: React.ReactNode
  className?: string
  style?: CSSProperties
  onClick?: () => void
  /** Max tilt in degrees (default 3) */
  tiltMax?: number
  /** Specular highlight radius in px (default 200) */
  shineSize?: number
  /** CSS border-radius — '9999px' for pill, '28px' for squircle (default '9999px') */
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

export function LiquidGlassPill({
  children,
  className,
  style,
  onClick,
  tiltMax = 3,
  shineSize = 200,
  borderRadius = '9999px',
}: LiquidGlassPillProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const shineRef = useRef<HTMLDivElement>(null)
  const rimRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const mouseRef = useRef({ x: 0.5, y: 0.5, inside: false })
  const smoothRef = useRef({ x: 0.5, y: 0.5 })

  const tick = useCallback(() => {
    const container = containerRef.current
    const shine = shineRef.current
    const rim = rimRef.current
    const glow = glowRef.current
    if (!container || !shine || !rim || !glow) {
      rafRef.current = requestAnimationFrame(tick)
      return
    }

    const lerp = mouseRef.current.inside ? 0.1 : 0.04
    smoothRef.current.x += (mouseRef.current.x - smoothRef.current.x) * lerp
    smoothRef.current.y += (mouseRef.current.y - smoothRef.current.y) * lerp

    const sx = smoothRef.current.x
    const sy = smoothRef.current.y

    // 3D tilt
    const tiltX = (sy - 0.5) * -tiltMax
    const tiltY = (sx - 0.5) * tiltMax
    container.style.transform = `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`

    // Specular highlight
    const shineX = sx * 100
    const shineY = sy * 100
    const shineOpacity = mouseRef.current.inside ? 1 : 0
    shine.style.background = `radial-gradient(${shineSize}px circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0.12) 30%, transparent 65%)`
    shine.style.opacity = String(shineOpacity)

    // Inner refraction glow — shifts OPPOSITE to cursor
    const glowX = 100 - shineX
    const glowY = 100 - shineY
    glow.style.background = `radial-gradient(ellipse at ${glowX}% ${glowY}%, rgba(140,180,255,0.15) 0%, transparent 60%)`

    // Rim light
    const rimAngle = Math.atan2(sy - 0.5, sx - 0.5) * (180 / Math.PI) + 90
    rim.style.background = `conic-gradient(from ${rimAngle}deg, rgba(255,255,255,0.50) 0deg, transparent 50deg, transparent 310deg, rgba(255,255,255,0.50) 360deg)`

    rafRef.current = requestAnimationFrame(tick)
  }, [tiltMax, shineSize])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [tick])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      mouseRef.current = {
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
        inside: true,
      }
    }

    const handleLeave = () => {
      mouseRef.current = { ...mouseRef.current, inside: false, x: 0.5, y: 0.5 }
    }

    el.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)
    return () => {
      el.removeEventListener('mousemove', handleMove)
      el.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : undefined,
        userSelect: onClick ? 'none' : undefined,
        background:
          'linear-gradient(135deg, rgba(160,190,255,0.036) 0%, rgba(180,160,255,0.022) 50%, rgba(160,200,255,0.029) 100%)',
        backdropFilter: 'blur(2.2px) saturate(170%)',
        WebkitBackdropFilter: 'blur(2.2px) saturate(170%)',
        border: '1px solid rgba(255, 255, 255, 0.45)',
        borderRadius,
        boxShadow: `
          0 8px 40px rgba(100, 140, 200, 0.12),
          0 2px 8px rgba(100, 130, 180, 0.06),
          inset 0 1px 0 rgba(255, 255, 255, 0.55),
          inset 0 -1px 0 rgba(255, 255, 255, 0.15)
        `,
        willChange: 'transform',
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
          opacity: 0.5,
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
          mixBlendMode: 'overlay',
        }}
      />

      {/* Inner refraction glow — caustic illusion */}
      <div
        ref={glowRef}
        style={{
          ...abs,
          borderRadius: 'inherit',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Chromatic tint — prismatic color shift at corners */}
      <div
        style={{
          ...abs,
          borderRadius: 'inherit',
          background:
            'linear-gradient(135deg, rgba(80,160,255,0.08) 0%, transparent 35%, transparent 65%, rgba(200,130,255,0.06) 100%)',
        }}
      />

      {/* Top-edge highlight — bright glass rim */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          pointerEvents: 'none',
          background:
            'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.8) 50%, transparent 90%)',
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>{children}</div>
    </div>
  )
}
