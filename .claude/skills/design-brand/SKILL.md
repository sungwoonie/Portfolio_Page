---
name: design-brand
description: Reference the design system of a real brand — Apple, Stripe, Vercel, Linear, Notion, Spotify, Tesla, Figma and 66 more — for palettes, type scales, and layout patterns. Use when the user says "make it look like <company>" or wants a proven real-world system as a starting point.
license: MIT
metadata:
  source: https://github.com/voltagent/awesome-design-md
  upstream_commit: 664b3e7
  count: 74
---

# Brand Design System

74 real-world design systems reverse-engineered from public sites — exact
palettes, type scales, spacing, component anatomy, and the reasoning behind each
choice. 64 of them carry machine-readable YAML token frontmatter.

## How to use

**1. Resolve the slug.** Read `INDEX.md` — one line per brand, with a `tokens`
column marking which have liftable YAML frontmatter.

- User named a company → match it. Note the near-misses: `bmw-m` (not `bmw`),
  `linear.app`, `mistral.ai`, `together.ai`, `cal`, `nintendo-2001`.
- User described a category instead ("something like a modern dev tool", "a
  clean fintech look") → shortlist 2–3 from the index and ask which.

**2. Load exactly one.** Read `references/<slug>/DESIGN.md`. These run 8–44KB,
so one is a real read and the full tree is 2.2MB — never sweep it.

For the 64 token-bearing entries, the YAML frontmatter (`colors:`,
`typography:`, `spacing:` …) can be lifted straight into a token file. The 10
prose entries — `kraken`, `lamborghini`, `lovable`, `mastercard`, `runwayml`,
`sanity`, `spotify`, `starbucks`, `tesla`, `theverge` — need the hex values read
out of the body text instead.

**3. Take the system, not the skin.** What transfers is the *structure*: the
neutral ramp, the type scale ratio, the spacing rhythm, how many accent colors
carry how much weight, where contrast is spent. Retune the brand hue to the
project's own and keep the structure — that's what makes these worth reading.

## Two things that will bite you

**Trademark.** These are analyses of other companies' brands. Structure,
technique, and layout patterns are fair to learn from. A site that ships a
brand's exact signature color plus its logo, wordmark, or name reads as that
company — which is a real legal problem, not a style question. Build the
project's own identity on top of the system you borrowed. If the user is
actually asking for a clone of a company's marketing page, say what's fine to
copy and what isn't.

**Fonts.** Most of these specify proprietary faces — SF Pro, Aeonik Pro,
Manuka, brand-custom families — that the project almost certainly can't
license. Substitute a metric-compatible open face (Inter, Geist, Satoshi,
Instrument Sans depending on the target) and say which one you picked and why.
Silently falling through to system-ui loses most of the look.

## Related

Generic aesthetics rather than companies — glassmorphism, brutalism, minimal —
live in the sibling `design-style` skill.
