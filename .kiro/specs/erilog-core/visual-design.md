# Visual Design: Erilog Marketing Landing Page

## Scope

This document covers only the `/` marketing landing page. Coordinator, operator, conflict-detail, and verifier interfaces remain frozen.

## Design Tokens (CSS Custom Properties)

```css
--erilog-canvas: #F1F2EE;
--erilog-surface: #FEFEFC;
--erilog-ink: #151816;
--erilog-muted: #69716C;
--erilog-border: #DDE4DF;
--erilog-mint: #18B889;
--erilog-mint-dark: #0E5C47;
--erilog-mint-wash: #DCF7EC;
--erilog-amber: #B86B00;
--erilog-red: #C73F46;
--erilog-evidence: #0D1310;
```

## Typography

- Headings + body: Geist Sans (via `next/font`)
- Technical: Geist Mono (hashes, IDs, receipts, code)
- Heading weight: 550–650 (avoid generic 800-weight)
- Body: 400, highly readable
- Scale: clamp-based responsive sizing

## Component Hierarchy

```
MarketingLayout
├── MarketingHeader (sticky, nav, CTA)
├── MarketingHero (eyebrow, headline, copy, CTAs, truth line)
├── SeedConflictPreview (evidence composition from seed-42)
├── IntegrityStrip (4 claims, icon + label)
├── OfflineProblemStory (Alpha/Bravo narrative)
├── EvidenceStageStack (3 sticky chapters)
├── FieldOperatorPreview (labelled marketing preview)
├── CoordinatorPreview (labelled marketing preview)
├── AuditTamperPreview (valid/tampered states)
├── IntegrityMatrix (guarantee table)
├── KiroBuildStory (spec→impl pipeline)
├── HonestLimitation (prominent callout)
├── FAQ (accordion)
├── FinalCTA (headline + 3 actions)
└── MarketingFooter (links, wordmark)
```

## Responsive Behavior

- Breakpoints: 640 (sm), 768 (md), 1024 (lg), 1280 (xl), 1440 (2xl)
- Mobile-first approach
- Sticky stage stack → normal flow on small screens or reduced motion
- Hero headline stacks naturally on mobile
- 44px minimum touch targets
- No horizontal overflow at any breakpoint

## Motion Rules

Allowed:
- Restrained hero word reveal (opacity + translateY, <400ms)
- Section reveal on scroll (IntersectionObserver, opacity + slight translateY)
- Three-stage sticky sequence (position: sticky with opacity transitions)
- Subtle event-chain movement (slow translateY loop, optional)

Forbidden:
- No requestAnimationFrame/setInterval overrides
- No scroll-jacking
- No dual-marquee animations
- No continuous distracting motion
- No button scale beyond 1.02

All motion respects `prefers-reduced-motion: reduce`.

## Content Truth Rules

- All seed-42 values read from typed content module (not inline magic numbers)
- No fake metrics, customers, testimonials, pricing, or traction
- "Tamper-evident" not "tamper-proof"
- "Independently verifiable" not "blockchain"
- No AI mentions except Kiro usage explanation
- No stock disaster/humanitarian photography
- Previews clearly labelled as marketing representations

## Reference-to-Erilog Section Mapping

| Aura Reference Section | Erilog Section |
|---|---|
| Header (Aura. + nav + CTA) | MarketingHeader (Erilog + nav + Open Dashboard) |
| Hero (AI context → pages) | MarketingHero (offline → evidence reconciliation) |
| Image collage | SeedConflictPreview (seed-42 evidence) |
| Logo strip | IntegrityStrip (4 capability claims) |
| "What Aura builds" | OfflineProblemStory (Alpha/Bravo conflict) |
| Sticky showcase (3 features) | EvidenceStageStack (record/reconcile/verify) |
| Product screenshots | FieldOperatorPreview + CoordinatorPreview |
| — | AuditTamperPreview (new, signature section) |
| Pricing cards | IntegrityMatrix (guarantee table) |
| — | KiroBuildStory (Kiro process) |
| — | HonestLimitation (prominent callout) |
| FAQ | FAQ |
| Final CTA | FinalCTA |
| Footer | MarketingFooter |

## Shape and Depth

- Controls: 14px radius
- Product cards: 20–24px
- Major feature surfaces: 28–32px
- Near-zero shadows (depth from borders + tonal difference)
- No glassmorphism, no excessive gradients, no 3D floating objects

## Icons

- Library: `@hugeicons/react` + `@hugeicons/core-free-icons`
- Consistent family (stroke style)
- Stroke: ~1.5–1.75px
- Size: 18–20px for nav/status
- Critical status: icon + text label always
