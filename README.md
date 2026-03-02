# react-liquid-glass

iOS 26-inspired liquid glass components for React. Zero dependencies beyond React — no Tailwind, no CSS imports, no setup.

**Features:**
- Cursor-reactive specular highlights with gaussian falloff
- Smooth 3D perspective tilt
- Animated conic rim lighting that follows your cursor
- Inner refraction glow (caustic illusion) on the Pill variant
- Chromatic prismatic tint at corners
- Top-edge highlight simulating light catching glass
- Full keyboard & screen-reader accessibility on interactive elements
- TypeScript-first with exported prop interfaces

## Install

```bash
npm install react-liquid-glass
```

## Components

### `<LiquidGlassCard />`

Frosted white glass (55% opacity) — ideal for cards, panels, modals.

```tsx
import { LiquidGlassCard } from 'react-liquid-glass'

<LiquidGlassCard style={{ padding: '32px' }} borderRadius="28px">
  <h2>Hello</h2>
  <p>Content sits on frosted glass.</p>
</LiquidGlassCard>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Content inside the glass |
| `className` | `string` | — | Optional CSS class |
| `style` | `CSSProperties` | — | Inline styles merged onto the container |
| `tiltMax` | `number` | `2.5` | Max 3D tilt in degrees |
| `shineSize` | `number` | `280` | Specular highlight radius in px |
| `borderRadius` | `string` | `'24px'` | CSS border-radius |

### `<LiquidGlassPill />`

Ultra-translucent glass (~10% opacity) — ideal for buttons, nav bars, pills over vibrant backgrounds.

```tsx
import { LiquidGlassPill } from 'react-liquid-glass'

<LiquidGlassPill onClick={() => console.log('click')} style={{ padding: '14px 36px' }}>
  Get Started
</LiquidGlassPill>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Content inside the glass |
| `className` | `string` | — | Optional CSS class |
| `style` | `CSSProperties` | — | Inline styles merged onto the container |
| `onClick` | `() => void` | — | Makes it an accessible button |
| `tiltMax` | `number` | `3` | Max 3D tilt in degrees |
| `shineSize` | `number` | `200` | Specular highlight radius in px |
| `borderRadius` | `string` | `'9999px'` | `'9999px'` for pill, `'28px'` for squircle |

## Tips

- Place over **colorful or gradient backgrounds** for the best effect — glass needs something to refract
- The Card variant works great on light backgrounds; the Pill variant shines on dark/vibrant ones
- Combine both: use a Card as a panel and Pills as buttons inside it
- All styles are inline — no CSS files, no Tailwind, no class conflicts

## Run the demo

```bash
git clone https://github.com/AnamGTR99/react-liquid-glass.git
cd react-liquid-glass
npm install
npm run demo
```

## License

MIT
