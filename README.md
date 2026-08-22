# Erilog

**Offline-first distribution reconciliation for small relief teams.**

Erilog helps field operators record physical handouts offline, reconciles conflicts deterministically on sync, and produces tamper-evident audit bundles that anyone can verify independently.

## Core Guarantee

**Conflicts cannot disappear.** Every physical handout event is preserved. Duplicate entitlement use becomes an explicit, traceable exception — never silently merged or overwritten.

## What It Does

1. **Record offline** — Operators scan or enter entitlement codes and confirm physical handouts with no network dependency.
2. **Reconcile on sync** — Deterministic engine detects duplicate redemptions and stock-policy breaches from any device sync order.
3. **Verify independently** — Export a signed audit bundle and check it in a static browser page, offline, without trusting the live system.

## Status

Hackathon demonstration release — **Ready, Spec, Ship** (August 2026).

See [`docs/product/PRD.md`](docs/product/PRD.md) for full requirements and [`docs/product/CONCEPT-BRIEF.md`](docs/product/CONCEPT-BRIEF.md) for the high-level concept.

## Quick Start

> Setup instructions will be added once the tech stack is confirmed and implementation begins.

## Project Structure

```
docs/
  product/        # PRD, concept brief
  technical/      # Architecture, ADRs (coming)
  process/        # Traceability, Kiro process notes (coming)
```

## License

TBD
