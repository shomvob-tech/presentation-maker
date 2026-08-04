# WheelSection — Full Implementation Spec

Agent-ready specification for recreating an interactive six-pillar SVG wheel section in a Next.js project. Focus is on **structure, interaction, geometry, styling, and layout**. Placeholder copy is used throughout; replace with project content at integration time.

Implement as a **client component**: dark-themed section with an interactive donut wheel, centered hub, auto-cycling focus, hover override, chip selectors, and an animated detail panel.

---

## 1. Purpose (behavioral)

A hub-and-spokes exploration UI:

1. Hover/tap wheel sectors (or the center hub)
2. Click numbered chips
3. Auto-cycle when the wheel is in view (paused on hover / reduced motion)

Section anchor: `#wheel` (or any id you prefer).

---

## 2. Stack & Dependencies

| Package | Role |
|---|---|
| `next` | App Router, static assets under `/public` |
| `react` / `react-dom` | Client hooks |
| `framer-motion` | `motion`, `AnimatePresence`, `useInView` |
| `lucide-react` | Icons (any icons; placeholders listed below) |
| `tailwindcss` | Utility classes + theme color tokens |

Required React APIs:

- `"use client"`
- `useEffect`, `useRef`, `useState`, `useSyncExternalStore`
- `framer-motion`: `AnimatePresence`, `motion`, `useInView`

Optional: a small shared `FadeInView` wrapper (spec below). Inline equivalent is fine.

---

## 3. Suggested File Layout

```
components/
  sections/
    WheelSection.tsx        # default export; subcomponents may stay in-file
  ui/
    FadeInView.tsx          # scroll-reveal helper (optional extract)
public/
  images/
    wheel-texture.jpeg      # texture for active sector + hub image reveal
app/
  globals.css               # color tokens
```

Usage:

```tsx
import WheelSection from "@/components/sections/WheelSection";

// inside <main>:
<WheelSection />
```

Path alias `@/` should resolve to project root (or `src/`).

---

## 4. Design Tokens

Register via Tailwind `@theme` (or equivalent). Use generic token names:

| Token | Hex | Usage |
|---|---|---|
| `wheel_dark1` | `#182837` | Section background; inactive sector stroke |
| `wheel_dark2` | `#203344` | Hub button background |
| `wheel_accent` | `#28a7ce` | Eyebrow, active chips, bullets, hub icon, glow |

Sector fills are hard-coded on pillar data (not tokens):

| Pillar | `fillHex` |
|---|---|
| Pillar 1 | `#1d3068` |
| Pillar 2 | `#234058` |
| Pillar 3 | `#2153ac` |
| Pillar 4 | `#274c66` |
| Pillar 5 | `#2577c0` |
| Pillar 6 | `#28a7ce` |

Glow filters:

```txt
GLOW_OFF = drop-shadow(0 0 0px rgba(40,167,206,0)) drop-shadow(0 0 0px rgba(40,167,206,0))
GLOW_ON  = drop-shadow(0 0 5px rgba(40,167,206,0.9)) drop-shadow(0 0 16px rgba(40,167,206,0.75))
```

Active label/icon drop shadow when over image: `drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]`.

---

## 5. Assets

| Path | Purpose |
|---|---|
| `/images/wheel-texture.jpeg` | SVG `<pattern>` fill for active sector; also hub `backgroundImage` when center is focused |

Requirements:

- Place at `public/images/wheel-texture.jpeg` (any suitable texture/photo).
- SVG uses `preserveAspectRatio="xMidYMid slice"`.
- Hub overlays image with `bg-black/35` when active so light text stays readable.
- Missing asset → image reveal blank; solid `fillHex` still shows.

---

## 6. Placeholder Content

Use generalized strings. Swap later for real copy.

### Header

- Eyebrow: `Section Label`
- H2: `Section Title`
- Subhead: `Section description goes here.`

### Center hub + default detail

- Hub primary: `Center`
- Hub secondary: `Center Pillar`
- Detail eyebrow: `Center Pillar`
- Detail title: `Center overview title`
- Detail body: `Center pillar description. Explore a pillar on the wheel — or a chip below — to see details.`

### Helper under wheel

- Hover-capable: `Hover a pillar to explore`
- Touch / coarse: `Tap a pillar to explore`

### Six pillars (data shape)

```ts
type Pillar = {
  id: string;
  number: string;       // "01"…"06"
  shortLabel: string;   // wheel label + chip short name
  title: string;        // detail panel title
  points: string[];     // exactly 3 bullets
  fillHex: string;
  lightText?: boolean;  // dark text when inactive (for light fills)
  Icon: LucideIcon;
};

const PILLARS: Pillar[] = [
  {
    id: "pillar-1",
    number: "01",
    shortLabel: "Pillar 1",
    title: "Pillar 1 Title",
    points: ["Pillar 1 point A", "Pillar 1 point B", "Pillar 1 point C"],
    fillHex: "#1d3068",
    Icon: Briefcase, // or any lucide icon
  },
  {
    id: "pillar-2",
    number: "02",
    shortLabel: "Pillar 2",
    title: "Pillar 2 Title",
    points: ["Pillar 2 point A", "Pillar 2 point B", "Pillar 2 point C"],
    fillHex: "#234058",
    Icon: ClipboardCheck,
  },
  {
    id: "pillar-3",
    number: "03",
    shortLabel: "Pillar 3",
    title: "Pillar 3 Title",
    points: ["Pillar 3 point A", "Pillar 3 point B", "Pillar 3 point C"],
    fillHex: "#2153ac",
    Icon: TriangleAlert,
  },
  {
    id: "pillar-4",
    number: "04",
    shortLabel: "Pillar 4",
    title: "Pillar 4 Title",
    points: ["Pillar 4 point A", "Pillar 4 point B", "Pillar 4 point C"],
    fillHex: "#274c66",
    Icon: Target,
  },
  {
    id: "pillar-5",
    number: "05",
    shortLabel: "Pillar 5",
    title: "Pillar 5 Title",
    points: ["Pillar 5 point A", "Pillar 5 point B", "Pillar 5 point C"],
    fillHex: "#2577c0",
    Icon: Users,
  },
  {
    id: "pillar-6",
    number: "06",
    shortLabel: "Pillar 6",
    title: "Pillar 6 Title",
    points: ["Pillar 6 point A", "Pillar 6 point B", "Pillar 6 point C"],
    fillHex: "#28a7ce",
    lightText: true, // light fill → dark text when inactive
    Icon: Handshake,
  },
];
```

Hub icon: any lucide icon (e.g. `RadioTower`).

Chip label format: `{number} {shortLabel}` e.g. `01 Pillar 1`.

---

## 7. Geometry Constants & Helpers

SVG viewBox is a square `400×400`. Sectors form a ring (donut) of 6 equal 60° wedges.

```ts
const VIEW_SIZE = 400;
const CENTER = VIEW_SIZE / 2;          // 200
const OUTER_R = 194;
const INNER_R = 98;
const SECTOR_ANGLE = 360 / PILLARS.length; // 60
const LABEL_RADIUS = (OUTER_R + INNER_R) / 2; // 146
```

### `round(value)`

Round to 3 decimal places: `Math.round(value * 1000) / 1000`.

### `polarToCartesian(cx, cy, r, angleDeg)`

0° at 12 o’clock, increasing clockwise:

```ts
const angleRad = ((angleDeg - 90) * Math.PI) / 180;
return {
  x: round(cx + r * Math.cos(angleRad)),
  y: round(cy + r * Math.sin(angleRad)),
};
```

### `describeSectorPath(cx, cy, innerR, outerR, startAngle, endAngle)`

Donut-sector SVG path:

1. Move to outer arc start
2. Outer arc (`A outerR outerR 0 largeArc 1 outerEnd`) — sweep `1`
3. Line to inner arc end
4. Inner arc back (`A innerR innerR 0 largeArc 0 innerStart`) — sweep `0`
5. Close `Z`

`largeArc = endAngle - startAngle > 180 ? 1 : 0` (always `0` for 60° sectors).

Pillar `index` maps to:

- `startAngle = index * SECTOR_ANGLE`
- `endAngle = startAngle + SECTOR_ANGLE`
- Label mid-angle = `startAngle + SECTOR_ANGLE / 2`
- Label position = `polarToCartesian(CENTER, CENTER, LABEL_RADIUS, midAngle)` as `%` of `VIEW_SIZE` for the HTML overlay

---

## 8. Component Architecture

Default export: `WheelSection`. Subcomponents may live in the same file.

```
WheelSection (state + layout)
├── FadeInView wrappers (header + columns)
├── PillarWheel
│   ├── SVG sectors (solid fill + image-pattern overlay)
│   ├── HTML icon/label overlay (pointer-events: none)
│   └── Center hub button
├── hint text (hover vs tap)
├── PillarChips
└── detail card
    └── AnimatePresence
        ├── CenterSummary   (activeId === null)
        └── PillarDetail    (active pillar)
```

Supporting pieces:

- `DetailIconBadge` — 44×44 (`h-11 w-11`) circle, `bg-wheel_accent/15`, icon `text-wheel_accent`
- `PillarChips` — wrap row of pill buttons
- Media hooks: `useMediaQuery`, `usePrefersReducedMotion`, `useHasHoverCapability`

---

## 9. State Machine & Interaction

### Cycle sequence

```ts
const CYCLE: (string | null)[] = [null, ...PILLARS.map(p => p.id)];
// [null, "pillar-1", "pillar-2", ..., "pillar-6"]
```

`null` = center hub / overview focused.

### State fields

| State | Type | Meaning |
|---|---|---|
| `cycleIndex` | `number` | Index into `CYCLE` for autoplay / selection |
| `isExtended` | `boolean` | After user select, use longer dwell |
| `hoveredId` | `string \| undefined` | `undefined` = not hovering; `""` = hub; pillar id otherwise |

### Derived

```ts
const hasHover = useMediaQuery("(hover: hover) and (pointer: fine)");
const isHovering = hasHover && hoveredId !== undefined;
const cycleActiveId = CYCLE[cycleIndex];
const activeId = isHovering ? (hoveredId || null) : cycleActiveId;
// hoveredId === "" → activeId null (hub)
const activePillar = PILLARS.find(p => p.id === activeId) ?? null;
```

### Auto-cycle timer

- Runs only when: wheel **in view** (`useInView(ref, { amount: 0.3 })`) AND NOT `prefersReducedMotion` AND NOT `isHovering`
- Dwell: `NORMAL_DWELL_MS = 3500`; after user select `EXTENDED_DWELL_MS = 9000`
- On tick: `cycleIndex = (cycleIndex + 1) % CYCLE.length`, clear `isExtended`
- Effect deps: `[cycleIndex, isExtended, isInView, prefersReducedMotion, isHovering]`

### Selection (`handleSelect(id: string)`)

- Hub passes `""`; treat as `null`: `CYCLE.findIndex(cycleId => cycleId === (id || null))`
- Set `cycleIndex`; set `isExtended = true`
- Used by: sector click/keyboard, hub click, chips

### Hover

- Only if `hasHover`
- `handleHoverStart(id)` → `setHoveredId(id)` (`""` for hub)
- `handleHoverEnd()` → `setHoveredId(undefined)`
- While hovering, `activeId` follows hover (does not mutate `cycleIndex`); auto-cycle paused; on leave, resumes from previous `cycleIndex`

### Active visual effects

When focused:

- `scale: 1.06` (spring unless reduced motion)
- `filter: GLOW_ON`
- Sector stroke: white `2.5` vs inactive `#182837` / `2`
- Image pattern opacity `1` on active sector; hub image + dimmer opacity `1` when hub active
- Pillars with `lightText: true`: dark text (`wheel_dark1`) when inactive; white + drop shadow when active

Scale transition:

- Reduced motion: `{ duration: 0 }`
- Else: `{ type: "spring", stiffness: 260, damping: 12 }`

Detail panel enter/exit (`AnimatePresence mode="wait"`):

```ts
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -12 }}
transition={{ duration: 0.35, ease: "easeOut" }}
```

---

## 10. PillarWheel Spec

### Props

```ts
type PillarWheelProps = {
  activeId: string | null;
  prefersReducedMotion: boolean;
  onSelect: (id: string) => void;
  onHoverStart: (id: string) => void;
  onHoverEnd: () => void;
};
```

### Container

- Outer: `relative mx-auto aspect-square w-full max-w-[460px] sm:max-w-[500px] md:max-w-[560px]`
- Soft ambient blob: `absolute inset-6 rounded-full bg-wheel_accent/10 blur-3xl` (aria-hidden)
- SVG: `viewBox="0 0 400 400"`, `relative h-full w-full select-none overflow-visible`, `role="group"`, `aria-label="Six-pillar wheel"`

### Pattern def

```xml
<pattern id="wheelTexture" patternUnits="userSpaceOnUse" width="400" height="400">
  <image href="/images/wheel-texture.jpeg" x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice" />
</pattern>
```

### Sector paint order (critical)

Sort so the **active sector renders last** (above neighbors):

```ts
[...PILLARS.keys()].sort(
  (a, b) => Number(PILLARS[a].id === activeId) - Number(PILLARS[b].id === activeId)
)
```

Each sector group:

1. **Solid** `motion.path` — fill `fillHex`, interactive
2. **Image** `motion.path` — fill `url(#wheelTexture)`, `pointerEvents="none"`, opacity 0↔1

Interactive path:

- `role="button"`, `tabIndex={0}`, `aria-pressed={isActive}`, `aria-label={`Pillar ${number}: ${title}`}`
- Click → `onSelect(id)`
- Keydown Enter/Space → preventDefault + `onSelect(id)`
- Mouse enter/leave → hover handlers
- Classes: `cursor-pointer outline-none transition-[filter] duration-500 ease-out hover:brightness-110 focus-visible:brightness-125`
- Transform origin: view-box center `200px 200px` via `transformBox: "view-box"`

### HTML label overlay

- Absolute full inset, `pointer-events-none`
- Per pillar: positioned at mid-sector `%`, framer `x/y: "-50%"` to center
- Icon `18×18`, label `13px` semibold uppercase tracking-wide
- Same scale/glow animation as sector

### Center hub

- Centered overlay flex; hub is `motion.button`
- Size: `aspect-square w-[41%]` of wheel container
- Style: rounded-full, `border-wheel_accent/35`, `bg-wheel_dark2`, shadow `0_10px_40px_rgba(0,0,0,0.35)`
- Content stack: icon `h-7 w-7 text-wheel_accent` → primary label (`15px` bold) → secondary label (`9px` uppercase tracking)
- Click / hover: `onSelect("")` / `onHoverStart("")`
- `aria-label="Reset to center overview"`, `aria-pressed={activeId === null}`
- Image layer + black/35 dimmer fade with hub active state

---

## 11. PillarChips Spec

- Flex wrap, `gap-2`
- Buttons: `rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide`
- Active: `border-wheel_accent bg-wheel_accent text-wheel_dark1`
- Inactive: `border-white/15 bg-white/5 text-slate-200` + hover `border-wheel_accent/60 text-white`
- `aria-pressed` bound to active state
- Click → `onSelect(pillar.id)` (extends dwell)

---

## 12. Detail Panel Spec

Container:

```
min-h-[260px] rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm
```

**CenterSummary** when no pillar active; **PillarDetail** otherwise.

Pillar detail list:

- `space-y-3`
- Each item: accent bullet `h-1.5 w-1.5 rounded-full bg-wheel_accent` + text `text-base leading-7 text-slate-200`

Header row pattern (both summaries):

- `DetailIconBadge` + eyebrow (`text-xs font-semibold uppercase tracking-[0.2em] text-wheel_accent`) + title (`text-lg font-semibold text-white`)

---

## 13. Section Layout & Responsive

```tsx
<section id="wheel" className="w-full bg-wheel_dark1 py-20 text-white md:py-28">
  <div className="mx-auto w-full max-w-[90rem] px-6 md:px-10">
    {/* header FadeInViews */}
    <div className="mt-16 grid grid-cols-1 items-center gap-14 md:mt-20 md:grid-cols-2 md:gap-10 lg:gap-16">
      {/* left: wheel + hint */}
      {/* right: chips + detail */}
    </div>
  </div>
</section>
```

| Breakpoint | Behavior |
|---|---|
| default | Single column; wheel above detail |
| `md+` | Two columns, items vertically centered |
| Wheel max width | 460 → 500 (`sm`) → 560 (`md`) |
| H2 | `text-4xl` → `md:text-5xl` → `lg:text-6xl` |
| Section padding | `py-20` → `md:py-28` |

Header FadeInView delays: eyebrow `0`, h2 `0.1`, subhead `0.2`. Columns: left `direction="left"`, right `direction="right"`.

Header typography:

- Eyebrow: `text-sm font-semibold uppercase tracking-[0.3em] text-wheel_accent`
- H2: `mt-4 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-tight text-white md:text-5xl lg:text-6xl`
- Subhead: `mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl`
- Hint under wheel: `text-center text-xs font-medium uppercase tracking-[0.15em] text-slate-400`

---

## 14. FadeInView Helper (include or inline)

```tsx
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type FadeDirection = "up" | "down" | "left" | "right";

export function FadeInView({
  children,
  delay = 0,
  className = "",
  direction = "up",
  duration = 0.6,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  direction?: FadeDirection;
  duration?: number;
}) {
  const directions = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 50 },
    right: { x: -50 },
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

---

## 15. SSR-Safe Media Queries

Use `useSyncExternalStore` so server snapshot is always `false` (no hydration mismatch):

```ts
function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false // server snapshot
  );
}

function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

function useHasHoverCapability() {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}
```

---

## 16. Accessibility Requirements

- Section landmark via `<section id="wheel">`
- Wheel `role="group"` with descriptive `aria-label`
- Each sector: `role="button"`, keyboard Enter/Space, `aria-pressed`, descriptive `aria-label`, nested `<title>` for native tooltip
- Hub button: `aria-label`, `aria-pressed` when overview active
- Chips: `aria-pressed`
- Decorative icons: `aria-hidden="true"` where appropriate
- Respect `prefers-reduced-motion` (no auto-cycle; zero-duration scale)
- Touch devices: no hover override; tap selects + extends dwell; hint copy changes

---

## 17. Acceptance Criteria Checklist

- [ ] Client component; no hydration warnings from media queries
- [ ] Six equal donut sectors + centered hub
- [ ] Auto-cycle: null → pillar-1…pillar-6 → null… every 3.5s when ≥30% in view
- [ ] User select extends next dwell to 9s
- [ ] Fine-pointer hover temporarily overrides active pillar without changing cycle index; pause autoplay while hovering
- [ ] Active sector scales 1.06, glows accent, shows image pattern, white stroke, paints above neighbors
- [ ] `lightText` pillars: dark labels when inactive; white when active
- [ ] Chips sync with active pillar; detail panel crossfades
- [ ] Reduced motion disables autoplay and scale springs
- [ ] Layout stacks on mobile, 2-col from `md`
- [ ] Texture asset present and used by pattern + hub
- [ ] Tokens / fills match hex values above

---

## 18. Implementation Order (recommended)

1. Add color tokens + place texture image
2. Port geometry helpers + `PILLARS` placeholder data
3. Build static wheel (SVG sectors + labels + hub) without animation
4. Wire `activeId` visuals (scale, glow, image opacity, stroke)
5. Add chips + detail panel with `AnimatePresence`
6. Add selection + extended dwell
7. Add in-view auto-cycle
8. Add hover capability gating + hover override
9. Add reduced-motion short-circuit
10. Wrap header/columns with FadeInView
11. A11y pass (keyboard, aria, labels)

---

## 19. Out of Scope / Non-goals

- No domain-specific marketing copy — only the interactive wheel UI pattern
- No routing, forms, or API calls
- No light/dark theme toggle — section is always dark (`bg-wheel_dark1`)
- Content strings are placeholders; swap at integration time
