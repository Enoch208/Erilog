# Concept Brief: Erilog

## One-liner

A lightweight reconciliation tool that helps small relief teams record offline handouts, detect conflicts on sync, and produce tamper-evident audit bundles — proving what happened, not hiding what went wrong.

## Problem

Small disaster-response teams distribute physical goods (kits, supplies) at points with unreliable connectivity. Multiple operators on separate devices record handouts independently. When devices reconnect, duplicate redemptions and stock mismatches are common — and traditional tools either silently overwrite history or require always-on infrastructure.

## Insight

You cannot prevent two disconnected devices from accepting the same entitlement. But you can guarantee that the conflict becomes visible, traceable, and independently verifiable after sync. The honest answer is better than a false clean total.

## Solution

Erilog preserves every offline handout as an immutable physical event. On sync, deterministic reconciliation surfaces duplicate-entitlement use and stock-policy breaches as explicit exceptions — without erasing the underlying records. A portable audit bundle lets any reviewer verify totals and integrity in a static browser page, offline and without trusting the live system.

## Core Guarantee

**Conflicts cannot disappear.** Every accepted physical event is preserved. Exceptions are surfaced, not suppressed. Resolution appends decisions; it never rewrites history.

## Key Differentiators

- **Offline-first by design** — operators record handouts with no network; reconciliation happens on reconnect.
- **Append-only event model** — physical events are immutable; corrections add records, never overwrite.
- **Deterministic reconciliation** — same events, any ingestion order, same result.
- **Independent verification** — static browser verifier checks bundle integrity without backend or network.
- **Tamper evidence** — any byte change in a covered file causes a named, diagnostic verification failure.

## Target Users

1. **Distribution Coordinator** — plans missions, allocates stock, reviews exceptions, exports audit bundles.
2. **Field Operator** — records handouts under time pressure on a phone, offline or online.
3. **Auditor / Reviewer** — verifies exported bundles independently without trusting the live application.

## Hackathon Scope

One narrow, complete vertical slice:

- Mission setup with stock allocation to two devices
- Offline handout recording (QR scan + manual entry)
- Idempotent sync with conflict detection
- Duplicate-entitlement exception surfacing
- Physical inventory reconciliation from events
- Tamper-evident audit bundle export
- Static offline verifier with Tamper Lab

## What This Is Not

- Not an identity system (no biometrics, no KYC)
- Not a payments platform
- Not an AI fraud detector
- Not a replacement for full humanitarian logistics software
- Not production-ready (hackathon demonstration release)

## Success Criteria (Hackathon)

| Metric | Target |
| --- | --- |
| Time to first offline handout (Judge Mode) | ≤ 60 seconds |
| Time to visible duplicate exception | ≤ 90 seconds |
| Seed-42 deterministic result | 4 handouts, 96 remaining, 1 exception |
| Valid bundle verification offline | Pass |
| Tampered bundle detection | Fail with diagnostic |
| Fresh-clone setup | ≤ 5 minutes |

## Technical Approach (Proposed)

- Monorepo with shared domain logic
- Offline storage via IndexedDB + service worker
- Append-only event log with hash chaining
- Pure-function reconciliation engine (no DB/UI dependency)
- Ed25519 signing for audit bundles
- Static HTML/JS verifier page

## Open Questions

See PRD §18 for decisions to resolve during implementation.
