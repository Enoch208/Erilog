---
inclusion: auto
---

# Visual Development Rule

## Status: BLOCKED

Visual implementation is **frozen** until an approved visual reference exists.

An "approved visual reference" means one of:
- A Figma design approved by the project owner
- An annotated wireframe or screenshot approved by the project owner
- An explicit visual specification approved by the project owner

## What is blocked

Do not design, generate, or make assumptions about:

- Page layouts, dashboards, navigation
- React presentation components
- Tailwind styling or arbitrary CSS
- Colors, typography, spacing, or design tokens
- Forms, cards, tables, modals, alerts, or charts
- Icons, illustrations, or app assets
- Responsive visual behavior
- Empty, loading, success, or error screens
- Judge Mode screens, operator screens, conflict-detail screens
- Tamper Lab screens, verifier web interface
- Landing or marketing pages

Do not use generic templates, default SaaS dashboards, shadcn-generated screens, or AI-generated placeholder interfaces.

## What is allowed

- Domain types and Zod schemas
- Pure functions and business logic
- Database schemas and migrations
- API routes (request/response contracts only, no UI)
- Headless modules (sync engine, event queue, offline storage)
- Cryptographic libraries (hashing, signing, verification)
- Service worker infrastructure (caching strategy, no visual shell)
- CLI tools and scripts
- Tests (unit, property, integration, E2E that don't assert visual state)
- Technical documentation

## Compile-time placeholders

If Next.js compilation requires `layout.tsx` or `page.tsx`, create only the smallest inert placeholder with no styling or product layout. Mark it:

```
// TODO(VISUAL-REFERENCE-REQUIRED)
```

Report every such placeholder. Prefer deferring completely where possible.

## Enforcement

This rule applies to all sessions until explicitly revoked by the project owner providing an approved visual reference.
