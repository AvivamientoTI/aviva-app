# DESIGN.md — Ujieres App

Generated from codebase analysis (`src/theme.js`, `src/index.css`, layout and component files).

---

## Color

### Strategy: Restrained
Warm-stone neutrals dominate, with gold-amber as the single accent. The accent appears in interactive elements, the brand logo, user badges, and data highlights — never as decoration.

### Palette

#### Brand Gold (primary accent)
| Token | Hex | Usage |
|---|---|---|
| `gold.0` | `#fffbeb` | Background tints, hover fills on light buttons |
| `gold.1` | `#fef3c7` | Hover states, subtle fills |
| `gold.2` | `#fde68a` | Muted borders |
| `gold.3` | `#fcd34d` | Active borders |
| `gold.4` | `#fbbf24` | Dark mode accent text, active nav dark |
| `gold.5` | `#f59e0b` | Interaction highlights, mesh gradient base |
| `gold.6` | `#d97706` | **Primary brand** — buttons, icons, active nav, link color |
| `gold.7` | `#b45309` | Button hover state, gradient end, burger icon |
| `gold.8` | `#92400e` | Deep hover states, active nav text light |
| `gold.9` | `#78350f` | Warm dark text base |

#### Warm Stone (neutral base)
| Token | Hex | Usage |
|---|---|---|
| `stone.0` | `#fafaf9` | Lightest surface tint |
| `stone.1` | `#f5f5f4` | Subtle background |
| `stone.2` | `#e7e5e4` | Dividers, borders |
| `stone.3` | `#d6d3d1` | Disabled state borders |
| `stone.4` | `#a8a29e` | Placeholder text |
| `stone.5` | `#78716c` | Secondary text |
| `stone.6` | `#57534e` | Stronger text |
| `stone.7` | `#44403c` | Deep text, service date labels |
| `stone.8` | `#292524` | Title text |
| `stone.9` | `#1c1917` | Near-black body text |

`gray` is aliased to `stone` in the Mantine theme for compatibility.

#### Semantic accents (data, status)
These use Mantine's built-in color system. Only use where the data semantics genuinely call for it.
- Success / attendance present: `teal` (also used for "today" urgency badge)
- Warning / partial / tomorrow: `orange`
- Error / absent: `red`
- Info: `blue`

### Gradients
```css
/* Brand button + avatar badge */
background: linear-gradient(135deg, #d97706 0%, #b45309 100%);

/* Button hover deepens */
background: linear-gradient(135deg, #b45309 0%, #92400e 100%);

/* Logo ThemeIcon */
gradient: { from: 'orange.6', to: 'yellow.6', deg: 135 }

/* Main background hint (AppShell main) */
radial-gradient(circle at top right, var(--mantine-color-gold-0), transparent)

/* Global body layer (::before pseudo) */
radial-gradient(circle at top right, rgba(217,119,6,0.03) 0%, transparent 60%)

/* Mesh gradient (WelcomeCard) */
background-color: #f59e0b + 5-point radial mesh in amber/orange hues (hsla 28–45)

/* Nav item active (light) */
linear-gradient(135deg, rgba(217,119,6,0.15) 0%, rgba(245,158,11,0.05) 100%)

/* Nav item active (dark) */
linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.05) 100%)
```

### Selection
```css
::selection {
  background-color: rgba(217, 119, 6, 0.2);
  color: #d97706;
}
```

### Notes
- **Never use `#000` or `#fff`** — use `stone.9` / `stone.0` instead (exception: export-month print layout uses `#ffffff`/`#222` for print fidelity)
- `login.css` uses off-brand blue (`#2563eb`) — does not match the gold system; flag for refactor
- `.text-premium` uses gradient clip text (`background-clip: text`) — violates the "no gradient text" law; replace with `gold.6` solid + weight contrast
- `UpcomingServiceCard` uses `variant="gradient"` on a Badge (background gradient, not text gradient). Borderline, but semantically the badge IS the label — acceptable here if not replicated widely

---

## Typography

### Fonts
- **Primary**: Inter (variable, weights 100–900, optical sizing 14–32)
- **Secondary**: Plus Jakarta Sans (loaded, minimal use in practice)
- Both loaded via Google Fonts

### Base
```css
font-family: "Inter", "Plus Jakarta Sans", system-ui, ...;
line-height: 1.5;
font-weight: 400;
letter-spacing: -0.011em;
-webkit-font-smoothing: antialiased;
```

### Scale
Ratios between steps: H1/H2 = 1.31, H2/H3 = 1.31, H3/H4 = 1.33 — all ≥ 1.25 minimum.

| Role | Token | Size | Weight | Letter-spacing var | Notes |
|---|---|---|---|---|---|
| H1 / Display | `--text-display` | 2.75rem | 700 | `--ls-display` (−0.024em) | Page heroes, WelcomeCard (clamped: `clamp(2rem, 5vw, 2.75rem)`) |
| H2 / Title | `--text-title` | 2.1rem | 700 | `--ls-heading` (−0.015em) | Section titles |
| H3 / Heading | `--text-heading` | 1.6rem | 700 | `--ls-heading` (−0.015em) | Card headers, service position name |
| H4 / Subheading | `--text-subheading` | 1.2rem | 700 | `--ls-ui` (−0.01em) | Sub-headers |
| Logo wordmark | — | 1.35rem | 900 | `--ls-display` | `SERVIDORES` |
| Micro tag | — | 10px | 800 | `--ls-tag` (+0.1em) | `AVIVAMIENTO Y PODER` |
| Stat value | `--text-title` | 2.1rem | 800 | `--ls-ui` | Dashboard metrics |
| Body | `--text-body` | 1rem | 400 | `--ls-body` (−0.011em) | Default prose |
| Small | `--text-small` | 0.875rem | 400–600 | `--ls-body` | Secondary content |
| Label / caption | `--text-caption` | 0.75rem | 700 | `--ls-label` (+0.05em) | `.section-label`, uppercase tags |
| Button | `--text-body` | 1rem | 700 | `--ls-ui` | All buttons |

### Letter-spacing tokens
```css
--ls-display: -0.024em;  /* H1, logo wordmark */
--ls-heading: -0.015em;  /* H2, H3 */
--ls-body:    -0.011em;  /* body, small */
--ls-ui:      -0.01em;   /* H4, stat values, buttons */
--ls-label:    0.05em;   /* uppercase section labels, role text */
--ls-tag:      0.1em;    /* micro uppercase tags */
```

### Utility class
```css
.section-label {
  font-size: var(--text-caption);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: var(--ls-label);
  color: var(--mantine-color-dimmed);
}
```

### Rules
- Uppercase labels always paired with `letter-spacing: 0.05em` minimum
- Negative letter-spacing on large display text only (titles, stats, wordmark)
- Line length: cap prose at 65–75ch; table cells and labels are exempt

---

## Elevation / Shadows

| Level | Value | Usage |
|---|---|---|
| 0 — Flat | none | Inline elements, nav items |
| 1 — Subtle | `0 1px 3px 0 rgba(0,0,0,0.05)` | App shell header (theme.js) |
| 2 — Card | `0 4px 6px -1px rgba(0,0,0,0.05)` | StatCard, default cards |
| 3 — Brand card | `0 4px 6px -1px rgba(217,119,6,0.2)` | Logo ThemeIcon, avatar badge |
| 4 — Lifted | `0 10px 20px -5px rgba(217,119,6,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)` | Card hover (via theme.js) |
| 5 — Emphasis | `0 10px 15px -3px rgba(217,119,6,0.3)` | Button hover |
| 6 — Modal | `0 25px 50px -12px rgba(0,0,0,0.25)` | Modal dialogs |
| Logo hover | `0 4px 20px -2px rgba(217,119,6,0.45)` | `.logo-icon:hover` |

**Two parallel hover systems exist on cards:**
- Theme.js `Card` component hover: gold brand shadow (level 4) on `translateY(-4px)`
- `.hover-card` CSS class hover: neutral shadow (`rgba(0,0,0,0.1)`) + `border-color: orange-4` on `translateY(-4px)`

StatCard uses both `.animate-fade-in hover-card`, so it gets the CSS class behavior (neutral shadow + orange border). This is intentional contrast from the default card theme.

---

## Spacing & Layout

### Grid
AppShell layout:
- Header height: 60px (mobile `base`) / 80px (`sm` and up)
- Navbar width: 260px (collapsed on mobile)
- Content padding: `xs` / 8px (mobile) — `md` / 16px (desktop)

### Spacing tokens (Mantine scale)
Use consistently; avoid arbitrary px values.
- `xs` — 8px: tight gaps, icon margins
- `sm` — 12px: stacked items
- `md` — 16px: standard padding
- `lg` — 20px: card internal padding
- `xl` — 24px: section spacing, card padding (standard for Card `p`)
- `2xl` / custom — 32px+: page-level separators

### Radius
| Element | Value |
|---|---|
| Default components | `md` (8px) |
| Cards, Paper | `lg` (12px) |
| UpcomingServiceCard | `xl` (rounded) |
| Buttons | `xl` (full pill) |
| Nav items | 12px (`.nav-item-premium`) |
| Avatar badge | 14px (inline style) |
| ThemeIcon (logo) | `xl` |
| Modals | `lg` |
| Heatmap ring | 2px ring from `teal.4` |

---

## Components

### Button
- Shape: pill (`radius: xl`)
- Fill: brand gradient `linear-gradient(135deg, #d97706 → #b45309)`
- Text: white, `fw: 700`, `ls: -0.01em`
- Shadow: `0 4px 6px -1px rgba(217,119,6,0.2)` at rest; deepens to `0 10px 15px -3px rgba(217,119,6,0.3)` on hover
- Hover: gradient deepens to `#b45309 → #92400e`
- Active: `scale(0.97)` press
- Transition: `transform 160ms --ease-out, box-shadow 200ms --ease-out`
- Variant `light`: `gold.0` fill, `gold.9` text, no shadow
- Variant `outline`/`subtle`: no gradient, no shadow, `gold.9` text
- `.btn-premium` class: equivalent to default filled variant, standalone use outside Mantine context
- `.btn-glass-subtle`: `rgba(255,255,255,0.05)` bg + blur + `orange.7` text (dark: `rgba(0,0,0,0.2)` + `yellow.4`)

### Card
- Radius: `lg` (12px), border: yes, shadow: `sm`
- Background: `var(--mantine-color-body)`
- Theme hover (desktop only): `translateY(-4px)` + gold brand shadow level 4
- Transition: `200ms --ease-out`
- **StatCard** specifics:
  - `minHeight: 148`, `p: xl`
  - Bottom border accent: `4px solid var(--mantine-color-${color}-6)` — full-width bottom edge (not side stripe; this pattern is intentional and exempt from the side-stripe ban)
  - Ghost icon watermark: absolute, `opacity: 0.03`, `rotate(15deg)`, top-right, size 110
  - Sparkline (from `@mantine/charts`): 80px wide, 32px tall, `curveType: "monotone"`, `fillOpacity: 0.6`, `strokeWidth: 2`
  - Uses `.hover-card` class (neutral shadow variant, not gold)

### WelcomeCard
- Outer: `.mesh-gradient` Box with `radius: lg`, overflow hidden
- Inner: `.glass-card` Card with `background: rgba(255,255,255,0.05)`, no border
- Decoration: ghost flame SVG, `opacity: 0.15`, size 320, absolute top-right, `rotate(15deg)`
- Brand badge: `variant="white" color="orange.9"`, `fw: 900`
- Title: `clamp(2rem, 5vw, 2.75rem)`, `lh: 1`, white
- Scripture quote: `rgba(0,0,0,0.18)` box, `border: 1px solid rgba(255,255,255,0.12)`, `radius: 12px`, italic fw 600
- Quote attribution: `yellow.4`, `fw: 900`, `ls: 0.2em`, uppercase

### UpcomingServiceCard
- `radius: xl`, `p: xl`, full border
- Ghost icon watermark: `opacity: 0.05`, size 160, top-right, absolute
- Header: gradient badge "PRÓXIMO SERVICIO" (`orange.6 → yellow.6`) + urgency badge (teal = today, orange = tomorrow)
- Position ThemeIcon: `gold`, `variant: light`, `radius: xl`, `size: lg`
- Position label hierarchy: `stone.5` dimmed department (uppercase caption) → `gold-text` H3 position name
- Date row: `IconCalendarEvent` at `#d97706` + `stone.7` `fw: 700`
- Service type: `Badge variant="light" color="stone"`
- CTA stack: calendar export Menu (secondary) + primary `btn-premium` button
- Empty state: centered `ThemeIcon` (stone, light) + copy + light stone button

### Badge
- Radius: `sm`
- Variant: `light` (default)
- Text: `fw: 700`, `tt: uppercase`, `ls: 0.05em`

### Modal
- Radius: `lg`
- Overlay: `backgroundOpacity: 0.4`, `blur: 2`
- Shadow: level 6
- Header border-bottom: `var(--mantine-color-default-border)`
- Title: Inter, `fw: 700`, `1.4rem`

### NavLink (sidebar)
- Class: `.nav-item-premium`
- Radius: 12px
- Padding: `10px 16px`
- Font: Inter, `fw: 600`
- Active light: gold-tinted gradient bg + `inset 0 0 0 1px rgba(217,119,6,0.2)` ring + `orange.8` text
- Active dark: yellow-tinted gradient bg + yellow ring + `yellow.4` text
- Hover (desktop): `translateX(4px)` + `rgba(0,0,0,0.03)` bg
- Transition: `transform 180ms, background-color 180ms, box-shadow 180ms --ease-out, color 180ms ease`
- Bottom pinned: Divider → "Cambiar Contraseña" (`gold.4`/`gold.9`) → "Cerrar Sesión" (`red.7`, `fw: 700`)

### App Shell
- Header: `.shell-glass` — `rgba(255,255,255,0.7)`, `backdrop-filter: blur(20px) saturate(180%)`, `border-bottom: 1px solid rgba(0,0,0,0.05)`
- Header dark: `rgba(13,13,13,0.7)`, `border-bottom: 1px solid rgba(255,255,255,0.05)`
- Sidebar: `.sidebar-glass` — `rgba(255,255,255,0.97)`, `border-right: 1px solid rgba(0,0,0,0.06)` (nearly opaque, not frosted)
- Sidebar dark: `rgba(18,17,16,0.97)`, `border-right: 1px solid rgba(255,255,255,0.06)`
- Main: `radial-gradient(circle at top right, var(--mantine-color-gold-0), transparent)` tint

### Logo (header)
- `ThemeIcon size={54} radius="xl"`, gradient `orange.6 → yellow.6 deg 135`
- Shadow: `0 4px 6px -1px rgba(217,119,6,0.2)`
- Hover: `scale(1.05)` + glow `0 4px 20px -2px rgba(217,119,6,0.45)`
- Wordmark: "SERVIDORES" `fw: 900` `size: 1.35rem` `ls: --ls-display`; "AVIVAMIENTO Y PODER" `size: 10px` `fw: 800` `ls: --ls-tag` `c: orange.7`

### Avatar (header)
- Size: 44×44px, `borderRadius: 14px`
- Background: brand gradient `#d97706 → #b45309`
- Content: initial letter, white, `fw: 900`
- Shadow: `0 4px 6px -1px rgba(217,119,6,0.2)`
- User name: `fw: 800`, `c: white` (dark) / `c: dark` (light)
- Role label: `gold.4` (dark) / `gold.6` (light), uppercase, `ls: --ls-label`, `fw: 700`, `opacity: 0.9`

---

## Motion

### Custom easing variables
```css
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);   /* strong ease-out for all interactions */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* on-screen movement */
```

### Duration scale
| Interaction | Duration | Easing |
|---|---|---|
| Button press | 160ms | `--ease-out` |
| Card hover | 200ms | `--ease-out` |
| Nav item hover | 180ms | `--ease-out` |
| Page entrance (`main`) | 350ms | `--ease-out` (`.animate-fade-in`) |
| Card entrance (`.animate-fade-in`) | 350ms | `--ease-out` |
| Wizard step (`.wizard-step`) | 250ms | `--ease-out` |
| Stagger step delta | 50ms | — |
| Stagger max (5 items) | 250ms | — |
| Attendance row color change | 350ms | `--ease-out` |
| Heatmap cell scale | 120ms | `ease` |
| Logo hover | 160ms / 200ms | `--ease-out` |

### Keyframes
```css
/* Page / card entrance */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
}

/* Wizard step */
@keyframes slideInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0);    }
}

/* Stepper active pulse */
@keyframes stepGlow {
  0%, 100% { box-shadow: 0 0 0 0   rgba(217,119,6,0.3); }
  50%       { box-shadow: 0 0 0 6px rgba(217,119,6,0); }
}
```

Stepper active step: `animation: stepGlow 2s ease-in-out infinite` on `.mantine-Stepper-stepIcon[data-progress]`.

### Reduced-motion
All animations and transitions collapse to `0.01ms` when `prefers-reduced-motion: reduce`.

---

## Utility Classes

| Class | Purpose |
|---|---|
| `.animate-fade-in` | Entrance: fadeInUp 350ms. Used on page main, cards |
| `.card-stagger-1` – `.card-stagger-5` | Stagger delays: 50ms–250ms (50ms steps) |
| `.hover-card` | Hover lift on cards (desktop only). Neutral shadow + `orange-4` border |
| `.wizard-step` | Step entrance: slideInUp 250ms |
| `.glass-card` | Glassmorphism panel. Used intentionally in WelcomeCard over mesh gradient |
| `.shell-glass` | App header: frosted glass, 70% white/dark opacity, blur(20px) saturate(180%) |
| `.sidebar-glass` | App sidebar: nearly opaque (97%), no blur |
| `.btn-premium` | Standalone gradient button outside Mantine context |
| `.btn-glass-subtle` | Ghost/subtle button: glass bg + orange/yellow text |
| `.nav-item-premium` | Styled nav link with gold active state and slide hover |
| `.heatmap-cell` | Heatmap cell: scale(1.4) on hover + teal ring |
| `.attendance-row` | Attendance row: smooth background-color transition |
| `.mesh-gradient` | Amber mesh gradient background (WelcomeCard hero) |
| `.section-label` | Uppercase caption label introducing a content zone |
| `.text-premium` | **Deprecated** — gradient clip text. Replace with `gold.6` solid + `fw: 800` |

---

## Dark Mode

Supported via Mantine's `useMantineColorScheme`. Key dark-mode overrides:
- `.glass-card`: `rgba(0,0,0,0.2)` fill, `rgba(255,255,255,0.05)` border
- `.shell-glass`: `rgba(13,13,13,0.7)` fill, `rgba(255,255,255,0.05)` border
- `.sidebar-glass`: `rgba(18,17,16,0.97)` fill, `rgba(255,255,255,0.06)` border
- `.nav-item-premium` active: `yellow.4` text + yellow-tinted gradient instead of orange
- `.btn-glass-subtle`: `rgba(0,0,0,0.2)` fill + `rgba(255,255,255,0.05)` border + `yellow.4` text
- User name: white in dark, `dark` in light
- Role/department label: `gold.4` dark, `gold.6` light
- Body background layer: `opacity: 0.1`, white-tinted radial gradient (not gold)

---

## Known Issues to Address

1. **`login.css` is off-brand** — uses blue (`#2563eb`) palette. Should be refactored to match gold/stone system.
2. **`.text-premium` uses gradient clip text** — violates the "no gradient text" law. Replace with `gold.6` solid + `fw: 800` or `fw: 900`.
3. **Two card hover systems coexist**: theme.js Card hover (gold shadow) and `.hover-card` CSS class hover (neutral shadow + orange border). StatCard uses the CSS class variant. Consolidate or explicitly document which surfaces use which.
4. **`UpcomingServiceCard` uses `variant="gradient"` Badge** — background gradient on a badge label. Acceptable but should not propagate further; consider switching to `variant="filled" color="orange"` for consistency.
5. **`StatCard` bottom border** — a 4px bottom border as a color signal per dimension. This pattern works here (it's a full-width bottom edge, not a side stripe) but should not be replicated as a left/right-side accent anywhere.
