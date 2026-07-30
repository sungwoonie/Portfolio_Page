---
name: design-style
description: Apply a named visual design style to UI — glassmorphism, neobrutalism, minimal, editorial, retro, material, shadcn, bento, claymorphism and 58 more. Use when the user names an aesthetic, asks to restyle or theme something, or wants a look picked for a vibe they describe.
license: MIT
metadata:
  source: https://github.com/bergside/awesome-design-skills
  upstream_commit: f631a09
  count: 67
---

# Design Style

67 visual style guides. Each is an implementation-ready spec: color roles, type
scale, spacing rhythm, component patterns, motion, and do/don't rules.

## How to use

**1. Resolve the slug.** Read `INDEX.md` — one line per style.

- User named a style → match it directly (`"make it brutalist"` → `brutalism`).
- User described a vibe → scan the index, shortlist the 2–3 closest, and ask
  which. Don't silently pick one when several fit; the whole look of the thing
  hangs on this.
- Adjacent slugs are easy to confuse. `minimal` / `clean` / `basic` /
  `spacious` are four different specs, as are `brutalism` / `neobrutalism` and
  `flat` / `material`. Read their index lines before choosing.

**2. Load exactly one.** Read `references/<slug>/STYLE.md` — the agent-facing
spec. Read `references/<slug>/DESIGN.md` only when you need the rationale or
extra tokens behind a decision.

Never read the whole `references/` tree. It is ~550KB; one style is ~4KB.

**3. Apply it to the code, don't transcribe it.** Set the style's palette and
scale on whatever token layer the project actually has — CSS custom properties,
a Tailwind theme, a design-token file — then build components against those
tokens. If there's no token layer yet, create one; a style pasted as literal hex
values into 30 components can't be changed later.

## Combining and adapting

- **One base style.** Two full specs in one surface fight each other — the two
  type scales and two shadow systems won't reconcile. Borrow a single element
  from a second style if you want (one accent treatment, one card shadow) and
  keep the rest from the base.
- **Accessibility outranks the spec.** Several styles lean on low-contrast
  effects by nature — `glassmorphism` translucency, `neumorphism` low-contrast
  extrusion, `dithered` and `matrix` texture. Where the spec's own combination
  lands under WCAG AA (4.5:1 body, 3:1 large text and UI boundaries), adjust the
  value and say what you changed. Ship a readable version of the style.
- **Check the fonts.** Specs name real typefaces, some of them commercial. Use
  what the project already licenses, or substitute a metric-compatible open
  face, and note the swap rather than emitting a silent fallback to system-ui.

## Related

Brand-specific systems (Apple, Vercel, Linear, Stripe …) live in the sibling
`design-brand` skill. Use that when the user names a *company*, this one when
they name an *aesthetic*.
