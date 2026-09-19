# CampusFindr — Design System

Version 1.0 | SIH1516 | Last updated 2026-08-06

---

## Philosophy

This design system was built to avoid the recognizable fingerprint of generic AI-generated UIs:
no indigo-600 brand colors, no gradient buttons, no ubiquitous glassmorphism, no emoji as icons.

Every decision is domain-specific: **teal** for *lost* (calm, search-like), **amber** for *found* (warm, discovery), **charcoal ink** for chrome. Colors carry semantic meaning, not decoration.

---

## Palette

### Light Mode (`:root`)

| Token | Value | Usage |
|---|---|---|
| `--clr-bg` | `#f5f4f2` | Page background |
| `--clr-surface` | `#ffffff` | Cards, navbar, modals |
| `--clr-surface-2` | `#f0eeec` | Panel backgrounds, form inputs |
| `--clr-surface-3` | `#e6e3df` | Hover states, skeleton shimmer |
| `--clr-text-primary` | `#1a1814` | Body text, headings |
| `--clr-text-secondary` | `#4a4540` | Labels, card content |
| `--clr-text-muted` | `#8a8278` | Timestamps, captions, placeholders |
| `--clr-border` | `rgba(0,0,0,0.08)` | Dividers, card borders |

### Dark Mode (`[data-theme="dark"]`)

| Token | Value | Usage |
|---|---|---|
| `--clr-bg` | `#0e0d0b` | Page background |
| `--clr-surface` | `#161412` | Cards, navbar, modals |
| `--clr-surface-2` | `#1e1b18` | Panel backgrounds |
| `--clr-text-primary` | `#f0ede8` | Body text |
| `--clr-text-muted` | `#5a5248` | Captions |

### Semantic Colors

| Status | Light | Dark | Usage |
|---|---|---|---|
| **Lost** | `#0d7a6e` (teal) | `#2dd4bf` | Lost items, focus rings, primary actions |
| **Found** | `#b45309` (amber) | `#fbbf24` | Found items, success indicators |
| **Claimed** | `#6d4c7e` (muted purple) | `#c084fc` | Status badge |
| **Resolved** | `#2d7a3a` (forest) | `#4ade80` | Resolved/archived badge, resolve button |
| **Danger** | `#b91c1c` | `#f87171` | Errors, deactivate button |

### Role Colors

| Role | Light | Dark |
|---|---|---|
| `superadmin` | amber `#b45309` | `#fbbf24` |
| `admin` (warden) | muted purple `#6d4c7e` | `#c084fc` |
| `user` (student) | teal `#0d7a6e` | `#2dd4bf` |

---

## Typography

**Pairing**: DM Serif Display (headings) + DM Sans (body)

| Element | Family | Size | Weight | Notes |
|---|---|---|---|---|
| Page H1 | DM Serif Display | 26px | 400 | `letter-spacing: -0.4px` |
| Modal/Section H2 | DM Serif Display | 20px | 400 | |
| Navbar brand | DM Serif Display | 19px | 400 | |
| Body | DM Sans | 14px | 400 | `line-height: 1.6` |
| Card title | DM Sans | 14px | 600 | |
| Labels / badges | DM Sans | 11–12px | 600 | `uppercase`, `letter-spacing: 0.5px` |
| Stat value | DM Serif Display | 30px | 400 | `letter-spacing: -1px` |

---

## Spacing Scale

Based on 4px unit. Use only these values:

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64`

CSS tokens: `--space-1` through `--space-16`.

---

## Corner Radii

**Three deliberate sizes** — do not introduce others:

| Token | Value | Used for |
|---|---|---|
| `--radius-sm` | `4px` | Skeleton, small chips, resolve button |
| `--radius-md` | `8px` | Cards, form inputs, buttons, panels |
| `--radius-lg` | `12px` | Modals, main panel containers |
| `--radius-full` | `9999px` | Pills, toggles, FAB, badges |

---

## Icon Set

**Lucide React** — import individual icons only. No emoji in UI.

Key icon mappings:
- Lost panel: `Search`
- Found panel: `PackageCheck`
- Navbar logo: `MapPin`
- Theme toggle: `Sun` / `Moon` (animated swap)
- Sign out: `LogOut`
- Admin: `ShieldAlert`
- Warden: `Shield`
- Student: `GraduationCap`
- Resolve: `CheckCircle2`
- Loading: `Loader2` (with `spin-icon` class)
- Category icons: `Laptop`, `FileText`, `ShoppingBag`, `BookOpen`, `Trophy`, `Key`, `Package`

---

## Animation

**Library**: Framer Motion

| Layer | Pattern |
|---|---|
| Page transitions | Fade + 8px slide (220ms, ease `[0.4,0,0.2,1]`) |
| Item card entrance | Staggered fade+10px slide (60ms delay per item) |
| Card hover | Spring `y: -2` (stiffness 300, damping 20) |
| Modal enter | Spring `y: 100% → 0` (stiffness 340, damping 30) |
| Modal exit | 220ms ease-out |
| Theme icon swap | Rotate+scale swap with `AnimatePresence` (180ms) |
| Field errors | Fade + 4px slide-in (150ms) |
| Empty states | Fade + 6px slide (250ms) |
| FAB | Spring scale on hover/tap |

**Rule**: Always animate `opacity`/`transform`, never layout properties. Keep durations 150–300ms for micro-interactions, up to 400ms for page transitions.

**prefers-reduced-motion**: Respected via global CSS `animation-duration: 0.01ms` override.

---

## Status / Role Config

Single source of truth: `src/config/statusConfig.js`

- `STATUS_CONFIG`: maps `lost | found | claimed | resolved | archived | unclaimed` → color tokens, icon name, label, CSS class
- `ROLE_CONFIG`: maps `superadmin | admin | user` → color tokens, icon name, label, CSS class
- `CATEGORY_CONFIG`: maps item categories → Lucide icon name, display label
- `ITEM_CATEGORIES`: ordered list of valid category strings (shared with server enum)

---

## Component Checklist (consistency)

All components draw from the same tokens. Check against this when adding new components:

- [ ] Uses CSS token colors (no hardcoded hex except in DESIGN_SYSTEM.md)
- [ ] Has both light and dark mode behavior via tokens
- [ ] Uses Lucide icons, no emoji
- [ ] Corner radius is one of: 4/8/12/9999px
- [ ] Animations use framer-motion or CSS keyframes (not `setTimeout` for visual transitions)
- [ ] Error states use `--clr-danger` tokens
- [ ] Loading states use SkeletonCard or loading-spinner, not bare spinners

---

## Follow-up Items

1. **Bundle splitting**: The JS bundle is ~690kB (gzip ~209kB) because framer-motion is large. Consider dynamic `import()` for AdminPanel.
2. **Real content images**: Item cards would benefit from image upload — placeholder is still `null`.
3. **E2E tests**: Playwright or Cypress tests for: login flow, report submission, warden resolve action, and admin create/deactivate.
4. **CORS hardening**: Currently allows `localhost:5173` and `localhost:4173` — should read from `ALLOWED_ORIGINS` env var in production.
5. **Helmet.js**: Add `helmet` middleware to the Express server for security headers.
6. **Pagination**: The active items feed has no pagination — will degrade with large datasets.
