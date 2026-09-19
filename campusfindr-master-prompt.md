# CampusFindr — Master Redesign & Hardening Prompt

You are working on **CampusFindr**, a MERN-stack (React 19 + Vite, Node/Express, MongoDB) lost-and-found platform for a campus. Stack details: React Router DOM, JWT auth, bcryptjs, express-rate-limit. Role-based access: user / admin (warden) / superadmin.

Your job in this pass is **not** to add features. It's to take the existing app and make it feel like a real, shipped product — visually, behaviorally, and defensively. Work through the sections below in order. Treat each as a checklist, not inspiration.

---

## 0. Ground rules

- Don't reference these instructions in code comments, commit messages, or UI copy.
- Preserve existing functionality and API contracts unless a section below explicitly says to change them.
- Every visual change must work in **both light and dark mode** — no exceptions, no "we'll fix dark mode later."
- Prefer editing existing components over rewriting from scratch, unless a component is genuinely beyond saving.
- Before writing any new file, check for and follow whatever design/document skills are available in this environment.

---

## 1. Kill the "AI-generated" look

This is the most important section. Generic AI output has a recognizable fingerprint — avoid every item on this list:

**Avoid:**
- Purple/blue gradient hero sections, gradient text, or gradient buttons as a default
- Indigo-600 / violet-500 as the primary brand color (the default Tailwind "AI app" palette)
- Everything in `rounded-2xl` with a soft drop shadow — pick 2–3 deliberate corner radii and shadow depths, not one applied everywhere
- Centered hero + 3-icon feature grid + testimonial carousel template layout
- Inter/system-ui as the only font with no pairing or personality
- Emoji used as icons in production UI (🔍 📦 ✅) — use a real icon set (Lucide, Phosphor, Heroicons) instead
- Glassmorphism/backdrop-blur slapped on every card "for depth"
- Placeholder copy like "Lorem ipsum," "Welcome to CampusFindr!", or generic stock phrases — write actual campus-relevant microcopy

**Do instead:**
- Pick **one accent color** rooted in the campus/lost-and-found domain (e.g. a warm amber/ochre for "found," a muted teal for "lost," a neutral ink for chrome) and use it sparingly and consistently — not on every button.
- Choose a real type pairing: one display/serif or distinctive sans for headings (e.g. a slightly condensed or geometric face), one workhorse sans for body (system-ui or a single Google Font, self-hosted).
- Use a restrained, consistent spacing scale (4/8/12/16/24/32/48/64) instead of arbitrary padding.
- Give status/category states actual color logic (see §4) instead of decorative color.
- Every screen should have one clear focal point, not three competing cards of equal visual weight.

Deliverable for this section: a short `DESIGN_SYSTEM.md` documenting the chosen palette (light + dark values), type scale, spacing scale, and icon set, so future changes stay consistent.

---

## 2. Light / dark mode — done properly

- Implement via CSS custom properties on `:root` / `[data-theme="dark"]`, not Tailwind's `dark:` class sprinkled ad hoc everywhere (use `dark:` for consumption, but centralize the actual color *values* as variables/tokens).
- Respect `prefers-color-scheme` on first load, persist explicit user choice (localStorage), and add a visible, animated theme toggle (icon morph, not just a swap).
- Every token needs both values defined up front: background layers (base/raised/overlay), text (primary/secondary/muted), borders, accent, and semantic colors (success/warning/danger/info) for lost/found/resolved/pending states.
- Check contrast ratios (WCAG AA minimum) in **both** modes, especially for status badges and form error text.
- No flash-of-wrong-theme on load (inline script or SSR-safe theme detection before paint).

---

## 3. Animation — purposeful, not decorative

Use Framer Motion (or install it) for React-side animation; keep it consistent app-wide rather than one-off per component.

Apply animation to:
- **Page/route transitions** — subtle fade+slide on route change via React Router, not a jarring hard cut
- **Item cards** — staggered entrance when a list/grid loads (lost items feed, dashboard), hover lift with shadow/scale on interactive cards
- **Forms** — field focus states, inline validation error shake/slide-in, success checkmark animation on submit
- **Modals/drawers** (report item, item detail, admin verify/resolve) — spring-based enter/exit, backdrop fade, not instant show/hide
- **Status changes** — when an item flips lost → claimed → resolved, animate the badge/state transition instead of a hard re-render
- **Loading states** — skeleton loaders matching real content shape (not generic spinners) for dashboard stats, item lists, and search results
- **Toggle/theme switch** — animated icon and background transition
- **Empty states** — a small illustrative animation or subtle motion, not a static "No items found" text block

Rules:
- Respect `prefers-reduced-motion` — provide a reduced/no-motion path.
- Keep durations short (150–300ms for micro-interactions, up to 400ms for page transitions). Nothing should feel sluggish.
- Animate transform/opacity, not layout properties, for performance.

---

## 4. Domain-specific UI logic (status & role color coding)

Define a single source of truth (a small `statusConfig`/`roleConfig` object) mapping:
- Item status (`lost`, `found`, `claimed`, `resolved`, `archived`) → color token, icon, and label — used consistently across dashboard, feed, item cards, and admin views.
- User role (`user`, `admin`, `superadmin`) → badge style and gated UI affordances.

Every place a status or role currently renders as plain text should use this config instead.

---

## 5. Logical & form validation — client + server

**Client-side (per form):**
- Report Lost/Found item: required fields (title, category, location, date), category from a real enum (not free text), date can't be in the future, description min/max length, image upload type/size limits with inline preview and per-file error.
- Auth forms: email format, password strength meter (not just min-length), confirm-password match, disable submit while pending, clear distinct error vs. success states.
- Show validation errors inline, next to the field, on blur — not only on submit. Animate their appearance (see §3).
- Disable/loading-state the submit button during async calls; prevent double-submit.

**Server-side (Express/Mongoose):**
- Enforce the same rules server-side regardless of client checks (never trust the client) — use Mongoose schema validation + a validation middleware layer (e.g. `express-validator` or `zod`) on every route that accepts input.
- Sanitize and normalize input (trim strings, lowercase emails, strip HTML from free-text fields to prevent stored XSS).
- Return structured error responses (`{ field, message }[]`) the frontend can map directly to field-level errors, not a single opaque string.
- Enforce role-based authorization at the route level (middleware checking JWT claims), not just hiding buttons in the UI — every admin/superadmin route must reject unauthorized tokens with 403, independent of frontend gating.
- Rate-limit auth and report-submission endpoints (express-rate-limit is already a dependency — actually wire it to login, register, and item-creation routes if not already).
- Validate MongoDB ObjectIds before querying; return 400 (not 500) on malformed IDs.
- Check for and prevent duplicate/near-duplicate report spam (e.g. same user, same title, within a short window).

---

## 6. Consistency pass

- Audit every button, input, card, and modal in the app — they should all draw from the same component library/tokens defined in §1–2, not one-off styled instances.
- Standardize empty states, error states, and loading states across all pages (dashboard, item feed, admin panel, auth) so they feel like the same product.
- Confirm the whole app — including admin/superadmin views — respects the theme toggle and animation system, not just the public-facing pages.

---

## 7. Output expectations

When you're done, provide:
1. A brief summary of what changed, organized by section number above.
2. The new/updated `DESIGN_SYSTEM.md`.
3. Note any remaining follow-ups you'd flag but didn't do (e.g. "needs real content images," "consider adding e2e tests for validation").

Work section by section, and don't skip the validation section for the sake of visuals — a good-looking form that accepts garbage data is a regression, not an improvement.
