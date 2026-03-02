import { createRoot } from 'react-dom/client'
import { LiquidGlassCard, LiquidGlassPill } from 'react-liquid-glass'

function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '48px',
        padding: '48px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background:
          'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      }}
    >
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '-0.02em',
        }}
      >
        react-liquid-glass
      </h1>

      {/* Card demo */}
      <LiquidGlassCard
        style={{ padding: '40px 48px', maxWidth: '420px', width: '100%' }}
        borderRadius="28px"
      >
        <h2
          style={{
            margin: '0 0 12px',
            fontSize: '22px',
            fontWeight: 700,
            color: '#1a1a2e',
            letterSpacing: '-0.02em',
          }}
        >
          LiquidGlassCard
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: '15px',
            lineHeight: 1.6,
            color: '#3a3a5c',
          }}
        >
          Frosted glass with cursor-reactive specular highlights, 3D tilt, and
          rim lighting. Move your mouse over the card.
        </p>
      </LiquidGlassCard>

      {/* Pill demo */}
      <LiquidGlassPill
        onClick={() => alert('Clicked!')}
        style={{ padding: '16px 40px' }}
      >
        <span
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.95)',
            letterSpacing: '-0.01em',
          }}
        >
          LiquidGlassPill — Click me
        </span>
      </LiquidGlassPill>

      {/* Pill as nav bar */}
      <LiquidGlassPill
        borderRadius="20px"
        style={{
          padding: '12px 32px',
          display: 'flex',
          gap: '32px',
        }}
      >
        {['Home', 'About', 'Work', 'Contact'].map((label) => (
          <span
            key={label}
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.85)',
            }}
          >
            {label}
          </span>
        ))}
      </LiquidGlassPill>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<App />)
