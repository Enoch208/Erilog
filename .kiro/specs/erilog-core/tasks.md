# Implementation Tasks: erilog-core

## Seed-42 Contract (Frozen)

Before any implementation begins, the following deterministic values are canonical. All tests, UI, server, and verifier must agree on these exact values.

```yaml
mission:
  id: "a1b2c3d4-0000-4000-8000-000000000001"
  name: "Emergency Distribution Alpha"
  policyVersion: 0
  totalStock: { "emergency_kit": 100 }
  allowances: [{ itemType: "emergency_kit", maxPerEntitlement: 1 }]
  tokenSalt: "seed42salt000000000000000000000000"

devices:
  alpha:
    id: "a1b2c3d4-0000-4000-8000-aaa000000001"
    label: "Alpha"
    allocation: { "emergency_kit": 50 }
  bravo:
    id: "a1b2c3d4-0000-4000-8000-bbb000000002"
    label: "Bravo"
    allocation: { "emergency_kit": 50 }

entitlementTokens:
  - raw: "HH-040"
    hash: "<sha256('seed42salt000000000000000000000000' + 'HH-040')>"
  - raw: "HH-041"
    hash: "<sha256('seed42salt000000000000000000000000' + 'HH-041')>"
  - raw: "HH-042"
    hash: "<sha256('seed42salt000000000000000000000000' + 'HH-042')>"

events:
  - id: "e0e0e0e0-0000-4000-8000-000000000001"
    device: alpha
    sequence: 0
    tokenRaw: "HH-040"
    itemType: "emergency_kit"
    quantity: 1
    previousHash: "GENESIS"
  - id: "e0e0e0e0-0000-4000-8000-000000000002"
    device: alpha
    sequence: 1
    tokenRaw: "HH-042"
    itemType: "emergency_kit"
    quantity: 1
    previousHash: "<eventHash of event 1>"
  - id: "e0e0e0e0-0000-4000-8000-000000000003"
    device: bravo
    sequence: 0
    tokenRaw: "HH-041"
    itemType: "emergency_kit"
    quantity: 1
    previousHash: "GENESIS"
  - id: "e0e0e0e0-0000-4000-8000-000000000004"
    device: bravo
    sequence: 1
    tokenRaw: "HH-042"
    itemType: "emergency_kit"
    quantity: 1
    previousHash: "<eventHash of event 3>"

reconciliationResult:
  summary:
    missionId: "a1b2c3d4-0000-4000-8000-000000000001"
    initialStock: { "emergency_kit": 100 }
    distributed: { "emergency_kit": 4 }
    remaining: { "emergency_kit": 96 }
    uniqueTokensServed: 3
    totalPhysicalHandouts: 4
  exceptions:
    - type: "duplicate_entitlement"
      tokenHash: "<hash of HH-042>"
      eventIds: ["e0e0e0e0-0000-4000-8000-000000000002", "e0e0e0e0-0000-4000-8000-000000000004"]
      deviceIds: ["a1b2c3d4-0000-4000-8000-aaa000000001", "a1b2c3d4-0000-4000-8000-bbb000000002"]
      quantities: [1, 1]
      status: "unresolved"
  eventSetDigest: "<sha256 of sorted 4 event IDs joined by newline>"

verifier:
  validBundle: "PASS — all checks passed"
  tamperedBundle:
    mutation: "event[1].quantity changed from 1 to 2"
    result: "FAIL"
    failures:
      - check: "file_checksum"
        file: "events.json"
        expected: "<original sha256>"
        observed: "<tampered sha256>"
```

Exact hash values will be computed in Task 1.3 (golden vectors) and become test fixtures.

---

## Phase 0 — Repository Setup and Kiro Configuration

### Task 0.1: Initialize Monorepo

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | — |
| Invariants | — |
| Design section | 1 (Repository Structure) |
| Dependencies | None |
| Blocks demo | Yes |
| Files | `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `.npmrc` |

**Objective:** Initialize pnpm workspace with Turborepo. Create `packages/reconcile`, `packages/schemas`, `packages/crypto`, `apps/web`, `apps/verifier` directory structure with minimal `package.json` and `tsconfig.json` per package.

**Acceptance criteria:**
- `pnpm install` succeeds with no errors.
- `turbo build` runs (may produce empty output) without error.
- All 5 workspace packages resolve cross-references.

**Test command:** `pnpm install && pnpm turbo build`
**Expected output:** Clean exit, no unresolved workspace references.

---

### Task 0.2: Pin Exact Dependencies

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | — |
| Invariants | — |
| Design section | Technology Decisions |
| Dependencies | 0.1 |
| Blocks demo | Yes |
| Files | All `package.json` files, `pnpm-lock.yaml` |

**Objective:** Pin exact versions (no `^` or `~`) for all dependencies:
- `typescript` (5.5+)
- `next` (14.2+)
- `react`, `react-dom` (18.3+)
- `zod` (3.23+)
- `dexie` (4.0+)
- `drizzle-orm`, `drizzle-kit` (0.31+)
- `@noble/ed25519` (2.1+)
- `vitest` (2.0+)
- `fast-check` (3.19+)
- `@playwright/test` (1.45+)
- `next-pwa` (5.6+)

**Acceptance criteria:**
- `pnpm install` produces a lockfile with exact versions.
- No `^` or `~` in any `dependencies` or `devDependencies`.
- `pnpm audit` reports no critical vulnerabilities.

**Test command:** `grep -r '"\\^\\|"~' packages/*/package.json apps/*/package.json | wc -l` → 0
**Expected output:** 0 lines matching.

**VERIFY item resolved:** `@noble/ed25519` version pinned.

---

### Task 0.3: CI Pipeline

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | — |
| Invariants | — |
| Design section | — |
| Dependencies | 0.1, 0.2 |
| Blocks demo | No (but blocks submission) |
| Files | `.github/workflows/ci.yml` |

**Objective:** GitHub Actions workflow: lint, typecheck, unit test, build. Runs on push and PR.

**Acceptance criteria:**
- Workflow runs `pnpm turbo lint typecheck test build` in sequence.
- Uses pnpm cache.
- Runs against Node 20 LTS.
- PostgreSQL service container available for integration tests.

**Test command:** Push to branch; workflow passes.
**Expected output:** Green check on all steps.

---

### Task 0.4: Kiro Steering and Quality-Gate Hook

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-JDG-5 (Kiro inspectable) |
| Invariants | — |
| Design section | — |
| Dependencies | 0.1 |
| Blocks demo | No (but blocks submission) |
| Files | `.kiro/steering/coding-standards.md`, `.kiro/hooks/quality-gate.json` |

**Objective:**
1. Create `.kiro/steering/coding-standards.md` with project conventions (strict TS, Zod-first validation, RFC 8785 canonicalization, append-only patterns, no `any`).
2. Create a Kiro PostFileSave hook that runs `pnpm turbo typecheck test --filter=...affected` on TypeScript file changes.

**Acceptance criteria:**
- Steering file renders correctly in Kiro context.
- Hook triggers on `.ts`/`.tsx` saves and runs typecheck + relevant tests.
- Hook exits 0 on clean code; non-zero on type errors.

**Test command:** Save a `.ts` file with a type error; hook reports failure.
**Expected output:** Hook stderr shows the type error.

---

### Task 0.5: Docker Compose for Local PostgreSQL

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | — |
| Invariants | — |
| Design section | 2 (Database Model) |
| Dependencies | 0.1 |
| Blocks demo | Yes |
| Files | `docker-compose.yml`, `.env.example` |

**Objective:** Docker Compose with PostgreSQL 15, health check, volume mount. `.env.example` with `DATABASE_URL` placeholder.

**Acceptance criteria:**
- `docker compose up -d` starts PostgreSQL on port 5432.
- `psql` can connect using `.env.example` values.
- No secrets in committed files.

**Test command:** `docker compose up -d && sleep 3 && docker compose exec db pg_isready`
**Expected output:** `accepting connections`

---

## Phase 1 — Schemas, Canonicalization, and Golden Vectors

### Task 1.1: Zod Schemas Package

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-OFF-4, REQ-MIS-1, REQ-MIS-5, REQ-SYN-2 |
| Invariants | INV-010 |
| Design section | 3 (Canonical Contracts) |
| Dependencies | 0.1, 0.2 |
| Blocks demo | Yes |
| Files | `packages/schemas/src/*.ts`, `packages/schemas/package.json` |

**Objective:** Implement all Zod schemas: `HandoutEventSchema`, `MissionPolicySchema`, `PolicyVersionSchema`, `DeviceSchema`, `SyncRequestSchema`, `SyncResponseSchema`, `ManifestSchema`. Export TypeScript types via inference.

**Acceptance criteria:**
- All schemas parse valid seed-42 data without error.
- All schemas reject invalid data (negative quantity, missing fields, wrong UUID format) with descriptive Zod errors.
- No PII fields exist in any event or device schema.
- Single `itemType: string` + `quantity: number` per event (no `items[]`).
- Sequence is `z.number().int().nonnegative()` (starts at 0).

**Test command:** `pnpm --filter @erilog/schemas test`
**Expected output:** All schema validation tests pass.

---

### Task 1.2: RFC 8785 Canonicalization

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-OFF-4, REQ-SYN-4, REQ-AUD-2 |
| Invariants | INV-003, INV-009 |
| Design section | 4.1 (Canonicalization) |
| Dependencies | 0.2 |
| Blocks demo | Yes |
| Files | `packages/crypto/src/canonicalize.ts`, `packages/crypto/tests/canonicalize.test.ts` |

**Objective:** Implement RFC 8785 JSON Canonicalization Scheme. Verify against the RFC's published test vectors (Section 3.2.4 of the RFC).

**Acceptance criteria:**
- Passes all RFC 8785 normative test vectors (number formatting, key ordering, Unicode escaping).
- Handles nested objects, arrays, and edge-case numbers correctly.
- UTF-8 output matches byte-for-byte with reference implementations.
- Works identically in Node and browser (no Node-specific APIs beyond TextEncoder).

**Test command:** `pnpm --filter @erilog/crypto test -- canonicalize`
**Expected output:** All RFC test vectors pass.

**VERIFY item resolved:** RFC 8785 implementation tested against RFC examples.

---

### Task 1.3: Golden Cryptographic Vectors

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-OFF-4, REQ-AUD-3, REQ-SYN-4, REQ-SYN-7 |
| Invariants | INV-003, INV-008, INV-009 |
| Design section | 4.2, 4.3, 6.4, 10.1 |
| Dependencies | 1.1, 1.2 |
| Blocks demo | Yes |
| Files | `packages/crypto/src/hash-chain.ts`, `packages/crypto/src/signing.ts`, `packages/crypto/tests/golden-vectors.test.ts`, `packages/crypto/fixtures/seed-42-vectors.json` |

**Objective:**
1. Implement `computeEventHash()` using RFC 8785 + SHA-256.
2. Implement Ed25519 sign/verify via `@noble/ed25519`.
3. Generate and freeze golden test vectors for seed-42:
   - 3 token hashes (salt + raw token → SHA-256)
   - 4 event hashes (RFC 8785 canonical → SHA-256)
   - 2 chain verifications (Alpha chain, Bravo chain)
   - 1 eventSetDigest (sorted IDs joined by `\n` → SHA-256)
   - 1 manifest signature (sign → verify round-trip)
   - 1 tampered manifest detection (byte change → verify fails)

4. Store vectors in `fixtures/seed-42-vectors.json` — shared by server, browser, and verifier tests.

**Acceptance criteria:**
- All computed hashes match frozen fixture values.
- Chain verification passes for valid chains, fails for broken chains.
- Signature verifies against known test key pair.
- Tampered data fails verification with expected diagnostic.
- Same vectors importable by all 3 consumers (packages/reconcile, apps/web, apps/verifier).

**Test command:** `pnpm --filter @erilog/crypto test -- golden`
**Expected output:** All golden vector assertions pass; fixture file unchanged.

**VERIFY item resolved:** Ed25519 key generation workflow documented via test key pair in fixtures.

---

## Phase 2 — Pure Reconciliation Engine

### Task 2.1: Core Reconciliation Function

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-SYN-4, REQ-SYN-5, REQ-SYN-6, REQ-SYN-7, REQ-SYN-9 |
| Invariants | INV-001, INV-003, INV-004, INV-005 |
| Design section | 6 (Reconciliation Algorithm) |
| Dependencies | 1.1 |
| Blocks demo | Yes |
| Files | `packages/reconcile/src/reconcile.ts`, `packages/reconcile/src/stock.ts`, `packages/reconcile/src/exceptions.ts`, `packages/reconcile/src/normalize.ts`, `packages/reconcile/src/types.ts` |

**Objective:** Implement `reconcile(input: ReconciliationInput): ReconciliationResult` as a pure function. Covers:
- Physical stock computation (all events count).
- Duplicate-entitlement exceptions (all events as peers, no winner).
- Per-event overspend exceptions.
- Device overspend exceptions.
- Deterministic exception IDs via `sha256(sorted_ids + '\n' + type)`.
- eventSetDigest computation.
- No timestamps or environmental data in result.

**Acceptance criteria:**
- `reconcile(seed42Input)` produces exactly the frozen seed-42 result.
- No `computedAt`, `winnerId`, `originalId`, `primaryEventId` fields in output.
- Exception `eventIds` are sorted; `quantities` and `timestamps` ordered by same sort.
- Empty event set returns zero-distributed summary with no exceptions.

**Test command:** `pnpm --filter @erilog/reconcile test -- reconcile.test`
**Expected output:** Seed-42 exact match; edge cases pass.

---

### Task 2.2: Property-Based Tests

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-SYN-4, REQ-SYN-5, REQ-SYN-6 |
| Invariants | INV-001, INV-002, INV-003, INV-004, INV-005, INV-007 |
| Design section | 11 (Property-Based Correctness) |
| Dependencies | 2.1, 1.2 |
| Blocks demo | Yes (launch gate) |
| Files | `packages/reconcile/tests/reconcile.property.test.ts`, `packages/reconcile/tests/arbitraries.ts` |

**Objective:** Implement all 8 property-based tests from design section 11:
1. Merge-order independence (fc.shuffledSubarray for shrinkability).
2. Idempotent replay (dedup layer + reconcile).
3. Physical stock conservation.
4. Duplicate visibility (all peers referenced).
5. Event preservation (every event's quantity in distributed).
6. No winner selection (scoped to `duplicate_entitlement`).
7. Tamper detection (semantic mutation → verification failure).
8. Resolution append-only (reconciliation unchanged by resolution records).

Create `arbitraries.ts` with proper shrinkable generators for events, policies, devices, and inputs.

**Acceptance criteria:**
- All 8 properties pass with 1000 runs each.
- Shrinking produces minimal counterexamples on intentional failures.
- No property tests the test code instead of the system.
- `fc.shuffledSubarray` used for permutations (not `fc.shuffle`).

**Test command:** `pnpm --filter @erilog/reconcile test -- property`
**Expected output:** 8 properties × 1000 runs, all pass.

---

### Task 2.3: Seed-42 Determinism Snapshot Test

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-JDG-2, REQ-JDG-4 |
| Invariants | INV-003 |
| Design section | 6.4 |
| Dependencies | 2.1, 1.3 |
| Blocks demo | Yes |
| Files | `packages/reconcile/tests/seed-42.test.ts`, `packages/reconcile/fixtures/seed-42-expected.json` |

**Objective:** Snapshot test that calls `reconcile()` with the frozen seed-42 input and asserts the output matches `seed-42-expected.json` byte-for-byte (after RFC 8785 canonicalization).

**Acceptance criteria:**
- Any change to reconciliation logic that alters seed-42 output causes this test to fail.
- Fixture file committed; changes require explicit update + review.

**Test command:** `pnpm --filter @erilog/reconcile test -- seed-42`
**Expected output:** Snapshot matches exactly.

---

## Phase 3 — Database and Immutable Policy Versions

### Task 3.1: Drizzle Schema and Migrations

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-MIS-1, REQ-MIS-3, REQ-MIS-6, REQ-SYN-12 |
| Invariants | INV-001, INV-006 |
| Design section | 2 (Database Model) |
| Dependencies | 0.5 |
| Blocks demo | Yes |
| Files | `apps/web/lib/server/db.ts`, `apps/web/lib/server/schema.ts`, `drizzle/*.sql`, `drizzle.config.ts` |

**Objective:** Define Drizzle ORM schema matching design section 2:
- `missions` (id, name, status, total_stock, activated_at, created_at)
- `policy_versions` (id, mission_id, version, policy, policy_hash, activated_at, created_at)
- `devices` (id, mission_id, label, allocation, package_hash, provisioned_at, created_at)
- `events` (id, mission_id, device_id, policy_version, sequence, token_hash, item_type, quantity, device_time, previous_hash, event_hash, accepted_at) — unique(device_id, sequence), FK to policy_versions
- `reconciliation_snapshots` (id, mission_id, event_set_digest, summary, exceptions, created_at) — unique(mission_id, event_set_digest)
- `judge_sessions` (id, token_hash, mission_id, seed, expires_at, created_at)

Generate SQL migrations.

**Acceptance criteria:**
- `pnpm drizzle-kit push` applies cleanly to empty PostgreSQL.
- Foreign key from events to policy_versions(mission_id, version) exists.
- Unique constraint on (device_id, sequence).
- events table has no UPDATE or DELETE allowed (enforced by role or trigger).

**Test command:** `pnpm drizzle-kit push && pnpm drizzle-kit check`
**Expected output:** No drift between schema and database.

---

### Task 3.2: Immutable Policy Enforcement

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-MIS-6 |
| Invariants | INV-006 |
| Design section | 2.2 |
| Dependencies | 3.1 |
| Blocks demo | Yes |
| Files | `apps/web/lib/server/policies.ts`, integration test file |

**Objective:** Server-side enforcement that activated policy versions cannot be modified:
- Application-level check before any update.
- Database-level: `REVOKE UPDATE, DELETE ON policy_versions FROM app_role` (or equivalent trigger).
- Integration test that attempts update and expects failure.

**Acceptance criteria:**
- Attempting to UPDATE a row in `policy_versions` where `activated_at IS NOT NULL` fails.
- Attempting to DELETE any policy_version row fails.
- Creating a new version for the same mission with a higher version number succeeds.

**Test command:** `pnpm --filter web test -- policies`
**Expected output:** Immutability constraints enforced; tests pass.

---

### Task 3.3: Event Append-Only Enforcement

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-SYN-12 |
| Invariants | INV-001 |
| Design section | 2.4 |
| Dependencies | 3.1 |
| Blocks demo | Yes |
| Files | Integration test file |

**Objective:** Ensure no UPDATE or DELETE is possible on the `events` table:
- `REVOKE UPDATE, DELETE ON events FROM app_role`
- Integration test attempts UPDATE/DELETE and expects SQL error.

**Acceptance criteria:**
- Raw SQL UPDATE on events table returns permission error.
- Raw SQL DELETE on events table returns permission error.
- INSERT succeeds normally.

**Test command:** `pnpm --filter web test -- events-immutable`
**Expected output:** Permission denied on UPDATE/DELETE; INSERT OK.

---

### Task 3.4: Seed-42 Database Seeder

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-JDG-2, REQ-JDG-4, REQ-MIS-7, REQ-MIS-8 |
| Invariants | — |
| Design section | Seed-42 Contract |
| Dependencies | 3.1, 1.3 |
| Blocks demo | Yes |
| Files | `scripts/seed-42.ts` |

**Objective:** Script that populates database with the exact seed-42 contract: mission, policy version, devices, token hashes. Does NOT insert events (those come from operator flow). Supports `--reset` to delete and re-seed a specific judge session.

**Acceptance criteria:**
- Running seed produces mission, policy, and devices with exact UUIDs from frozen contract.
- `--reset` is idempotent and session-scoped.
- Computed values (token hashes, policy_hash) match golden vectors from Task 1.3.

**Test command:** `pnpm tsx scripts/seed-42.ts && pnpm tsx scripts/seed-42.ts --reset`
**Expected output:** Seed applied; reset returns to initial state.

**VERIFY item resolved:** Seed-42 exact event IDs defined in implementation.

---

## Phase 4 — Sync, Replay Handling, and Offline Queue

### Task 4.1: Sync API Endpoint

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-SYN-1, REQ-SYN-2, REQ-SYN-3, REQ-SYN-10 |
| Invariants | INV-001, INV-002 |
| Design section | 5 (Sync Protocol) |
| Dependencies | 3.1, 1.1, 1.3 |
| Blocks demo | Yes |
| Files | `apps/web/app/api/sync/route.ts` |

**Objective:** Implement POST `/api/sync` per design section 5.4:
1. Auth gate (check session before revealing state).
2. Zod validation.
3. Mission/device membership check.
4. Policy version existence check.
5. Three-way idempotency: same content = `already_seen`; different content = `EVENT_ID_COLLISION`; new = validate chain.
6. Sequence and chain validation (per-device, independent).
7. Hash recomputation via RFC 8785.
8. INSERT accepted events.
9. Trigger reconciliation snapshot.
10. Return categorized results.

**Acceptance criteria:**
- Valid new event → `accepted`.
- Identical replay → `already_seen` (no state change).
- Same ID, different content → `quarantined` with `EVENT_ID_COLLISION`.
- Broken chain → `quarantined` with `CHAIN_BREAK`.
- Sequence gap → `quarantined` with `SEQUENCE_GAP`.
- Unauthorized request → 401 before revealing existence.
- After acceptance, new reconciliation_snapshot row exists with correct event_set_digest.

**Test command:** `pnpm --filter web test -- sync`
**Expected output:** All sync scenarios pass.

---

### Task 4.2: Client Sync Engine

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-SYN-13, REQ-NFR-2, REQ-SYN-10, REQ-SYN-11 |
| Invariants | INV-001 |
| Design section | 5.5 (Client Sync Engine) |
| Dependencies | 1.1, 0.2 |
| Blocks demo | Yes |
| Files | `apps/web/lib/offline/sync-engine.ts`, `apps/web/lib/offline/event-queue.ts` |

**Objective:** Client-side sync engine:
- Batches events (max 100) ordered by sequence.
- Exponential backoff (2s initial, 60s max).
- Dequeues `accepted` and `already_seen`.
- Marks `quarantined` with reason (visible to operator).
- 1-hour cumulative online warning.
- Handles network errors gracefully (no data loss).

**Acceptance criteria:**
- Unit test: mock server returns mixed results; queue state updates correctly.
- Unit test: network error does not remove events from queue.
- Unit test: backoff doubles on failure, resets on success.
- Unit test: 1-hour timer triggers warning.

**Test command:** `pnpm --filter web test -- sync-engine`
**Expected output:** All sync engine scenarios pass.

---

### Task 4.3: Dexie Database and Offline Event Recording

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-OFF-1, REQ-OFF-4, REQ-OFF-6, REQ-OFF-10, REQ-OFF-13, REQ-NFR-1 |
| Invariants | INV-001, INV-006 |
| Design section | 12 (Dexie Schema) |
| Dependencies | 1.1, 1.3 |
| Blocks demo | Yes |
| Files | `apps/web/lib/db/client.ts`, `apps/web/lib/db/schema.ts`, `apps/web/lib/db/queries.ts`, `apps/web/lib/offline/stock.ts` |

**Objective:** Implement Dexie database:
- `events` table with indexes (id, missionId, deviceId, sequence, tokenHash, syncStatus).
- `missions` table for cached mission package.
- `meta` table for device metadata.
- `createEvent()` function that: generates UUIDv4, computes hash chain (RFC 8785), writes to IDB, decrements local stock only after successful write.
- Write failure → error displayed, no stock change, pre-confirmation state.
- Same-device duplicate token detection (query by tokenHash before confirm).

**Acceptance criteria:**
- Creating an event returns the event with valid hash chain.
- Write failure (simulated) does not decrement stock.
- Duplicate token on same device triggers warning path (returns flag, does not auto-reject).
- Events survive Dexie DB close/reopen cycle.
- Sequence is monotonic per device (0-indexed).

**Test command:** `pnpm --filter web test -- dexie`
**Expected output:** All offline storage tests pass.

---

### Task 4.4: Storage Persistence and Eviction Warning

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-OFF-11 |
| Invariants | — |
| Design section | 9.1 |
| Dependencies | 4.3 |
| Blocks demo | No |
| Files | `apps/web/lib/offline/persistence.ts` |

**Objective:** On app startup while pending events exist, request `navigator.storage.persist()`. If denied, display persistent UI warning about eviction risk.

**Acceptance criteria:**
- When `persist()` resolves true, no warning shown.
- When `persist()` resolves false and pending events exist, warning is visible.
- When no pending events exist, no request made.

**Test command:** `pnpm --filter web test -- persistence`
**Expected output:** Both paths tested; warning logic correct.

---

## Phase 5 — PWA Interface and Judge Mode

### Task 5.1: Next.js App Shell and PWA Configuration [VISUAL-REFERENCE-REQUIRED]

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-OFF-1, REQ-OFF-12 |
| Invariants | — |
| Design section | 12 (PWA) |
| Dependencies | 0.2 |
| Blocks demo | Yes |
| Files | `apps/web/next.config.ts`, `apps/web/public/manifest.json`, `apps/web/public/sw.js`, `apps/web/app/layout.tsx` |

**Objective:** Configure Next.js with next-pwa:
- Service worker precaches app shell and reconcile bundle.
- Runtime cache for mission package (cache-first).
- Network-only for sync/API calls.
- Manifest with appropriate PWA metadata.
- "Offline-ready" depends on SW active + mission cached + IDB accessible.

**Acceptance criteria:**
- `next build` produces a valid service worker.
- App loads offline after initial visit (app shell cached).
- API calls are not cached.

**Test command:** `pnpm --filter web build`
**Expected output:** Build succeeds; SW generated.

---

### Task 5.2: Judge Mode Entry and Session Management [VISUAL-REFERENCE-REQUIRED]

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-JDG-1, REQ-MIS-7, REQ-MIS-8 |
| Invariants | — |
| Design section | 2.7, 8 (Trust Boundaries) |
| Dependencies | 3.4, 5.1 |
| Blocks demo | Yes |
| Files | `apps/web/app/api/judge/route.ts`, `apps/web/app/judge/[sessionId]/page.tsx` |

**Objective:**
- GET `/api/judge` creates a new session: generates capability token, stores SHA-256 hash in DB, seeds mission, sets HttpOnly cookie (`__Host-session`; SameSite=Strict; short TTL).
- Redirects to `/judge/[sessionId]`.
- Session page loads seed-42 mission data.
- Reset button calls seed script (session-scoped).
- Sessions expire and are isolated.

**Acceptance criteria:**
- Public URL → seeded session in one action, no signup.
- Cookie is HttpOnly, SameSite=Strict, has expiry.
- Token stored as SHA-256 hash only.
- Two judge sessions are fully isolated.
- Reset restores exact seed-42 state.

**Test command:** `pnpm --filter web test -- judge-session`
**Expected output:** Session isolation and security tests pass.

**VERIFY item resolved:** Judge session token hashing and expiration specified.

---

### Task 5.3: Coordinator Mission View [VISUAL-REFERENCE-REQUIRED]

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-MIS-1, REQ-MIS-2, REQ-MIS-3, REQ-MIS-4 |
| Invariants | — |
| Design section | 2.1, 2.2, 2.3 |
| Dependencies | 5.2 |
| Blocks demo | Yes |
| Files | `apps/web/app/judge/[sessionId]/coordinator/page.tsx`, related components |

**Objective:** Judge Mode coordinator view showing:
- Mission name, total stock, policy (read-only for seed-42).
- Two devices (Alpha, Bravo) with allocations.
- Stock summary (updates after reconciliation).
- Exception list (after sync).
- Link to operator view for each device.

**Acceptance criteria:**
- Displays seed-42 mission correctly.
- Shows 100 total stock, 50/50 allocation.
- After events sync: shows 4 distributed, 96 remaining, 3 unique tokens, 1 exception.
- Exception shows HH-042 with both event IDs as peers (no winner label).

**Test command:** Visual + `pnpm --filter web test -- coordinator-view`
**Expected output:** Data matches seed-42 contract.

---

### Task 5.4: Operator Offline Recording View [VISUAL-REFERENCE-REQUIRED]

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-OFF-1 through REQ-OFF-13 |
| Invariants | INV-001, INV-006 |
| Design section | 12 (Dexie), 4 (Hashing) |
| Dependencies | 4.3, 5.2 |
| Blocks demo | Yes |
| Files | `apps/web/app/judge/[sessionId]/operator/[deviceId]/page.tsx`, related components |

**Objective:** Operator view with:
- Offline-ready indicator.
- Token input (manual text field; QR scan P1).
- Local token validation against mission package.
- Confirm handout button (disabled at 0 stock).
- Receipt showing "Recorded on this device — pending sync".
- Local stock counter.
- Event queue with sync status.
- Same-device duplicate warning (acknowledgeable).
- No cross-device conflict warnings (REQ-OFF-8).
- Write failure returns to pre-confirmation.

**Acceptance criteria:**
- Records handout while offline (network disabled in DevTools).
- Event persists through reload.
- Stock decrements correctly.
- Duplicate token on same device shows warning.
- Unknown token is rejected with reason.
- At stock 0, confirm button is disabled.
- Receipt never says "approved" or "globally confirmed."

**Test command:** `pnpm --filter web test -- operator-view`
**Expected output:** All offline recording scenarios pass.

---

### Task 5.5: Signature Demo Flow (End-to-End Manual Path) [VISUAL-REFERENCE-REQUIRED]

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-JDG-2, REQ-JDG-3 |
| Invariants | All |
| Design section | All |
| Dependencies | 5.2, 5.3, 5.4, 4.1, 4.2 |
| Blocks demo | Yes |
| Files | N/A (integration of existing components) |

**Objective:** The complete seed-42 signature demo path works end-to-end:
1. Enter Judge Mode → seeded session.
2. Open Alpha operator → record HH-040 and HH-042 offline.
3. Open Bravo operator → record HH-041 and HH-042 offline.
4. Sync Alpha → 2 events accepted.
5. Sync Bravo → 2 events accepted.
6. Coordinator view shows: 4 distributed, 96 remaining, 1 exception (HH-042, 2 peers).
7. Export audit bundle → signed ZIP.
8. Verify bundle → PASS.
9. Tamper (quantity 1→2) → verify → FAIL with diagnostic.

**Acceptance criteria:**
- All 9 steps complete within 90 seconds from Judge Mode entry.
- Deterministic result matches seed-42 contract exactly.

**Test command:** Manual walkthrough + Playwright E2E (Task 7.1).
**Expected output:** Complete flow, all values match contract.

---

## Phase 6 — Audit Bundle and Static Verifier

### Task 6.1: Audit Bundle Export

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-AUD-1, REQ-AUD-2, REQ-AUD-3, REQ-AUD-4 |
| Invariants | INV-008, INV-009 |
| Design section | 10 (Audit Bundle Structure) |
| Dependencies | 2.1, 1.3, 3.1 |
| Blocks demo | Yes |
| Files | `apps/web/lib/server/export.ts`, `apps/web/app/api/export/route.ts` |

**Objective:** Implement bundle export:
- Fetch latest reconciliation snapshot.
- Serialize policy, events, summary as canonical JSON (RFC 8785).
- Compute per-file SHA-256 checksums.
- Build manifest with all required fields (schemaVersion, algorithmVersion, policyVersion, keyId, eventSetDigest, canonicalization, eventCount, files).
- Sign manifest bytes with Ed25519 private key.
- Package into ZIP (manifest.json, policy.json, events.json, summary.json, signature.bin).
- No secrets or PII in bundle.

**Acceptance criteria:**
- Export for seed-42 produces a valid ZIP.
- Manifest contains all required fields.
- Per-file checksums verify correctly.
- Ed25519 signature verifies against the server's public key.
- ZIP contains exactly 5 files (no extras).

**Test command:** `pnpm --filter web test -- export`
**Expected output:** Export tests pass; bundle structure valid.

---

### Task 6.2: Static Verifier — Core Verification

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-AUD-5, REQ-AUD-6, REQ-AUD-7 |
| Invariants | INV-008, INV-009 |
| Design section | 10.2 (Verification Procedure) |
| Dependencies | 1.2, 1.3, 2.1 |
| Blocks demo | Yes |
| Files | `apps/verifier/src/verifier.ts`, `apps/verifier/src/pinned-key.ts`, `apps/verifier/src/index.html`, `apps/verifier/vite.config.ts` |

**Objective:** Static verifier page that:
1. Accepts ZIP file via drag-and-drop or file picker.
2. Parses with safety limits (max 20 files, 50 MB, ratio < 100:1, path allowlist).
3. Extracts manifest.json and signature.bin.
4. Verifies Ed25519 signature against **pinned public key** (baked at build).
5. Compares manifest.keyId against pinned key fingerprint.
6. Checks manifest completeness (no extra files, no missing files).
7. Verifies per-file SHA-256 checksums.
8. Parses policy and events; runs `reconcile()`.
9. Compares recomputed result to summary.json (RFC 8785 canonical byte equality).
10. Displays PASS or per-check FAIL diagnostics.

**Acceptance criteria:**
- Valid seed-42 bundle → "PASS — all checks passed."
- Modified event → FAIL with "File events.json: expected SHA-256 [x], computed [y]."
- Wrong signature → FAIL with "Signature verification failed. Expected key: [fingerprint]."
- Extra file in ZIP → FAIL with "Archive contains [file] not listed in manifest."
- Works with browser network disabled.
- Builds to single static HTML+JS bundle (no server needed).

**Test command:** `pnpm --filter verifier test && pnpm --filter verifier build`
**Expected output:** Tests pass; build produces `dist/index.html`.

---

### Task 6.3: Tamper Lab

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-AUD-8 |
| Invariants | INV-009 |
| Design section | 10, 9.3 |
| Dependencies | 6.2 |
| Blocks demo | Yes |
| Files | `apps/verifier/src/tamper-lab.ts` |

**Objective:** Tamper Lab mode in the verifier:
- Clones bundle in browser memory.
- Provides UI to select a mutation (preset: "Change event quantity from 1 to 2").
- Applies mutation to events.json in-memory.
- Re-runs full verification on mutated copy.
- Original file is never modified.
- Does NOT "fix" the bundle — demonstrates detection only.

**Acceptance criteria:**
- Seed-42 bundle with quantity 1→2 mutation produces FAIL.
- Failure diagnostic names: check=file_checksum, file=events.json, expected/observed hashes.
- Original bundle still verifies as PASS after tamper lab run.
- No network requests during any operation.

**Test command:** `pnpm --filter verifier test -- tamper`
**Expected output:** Tamper detection tests pass.

---

### Task 6.4: Generate Signing Key Pair Script

| Field | Value |
|---|---|
| Priority | Core |
| Requirements | REQ-NFR-6, REQ-AUD-5 |
| Invariants | INV-009 |
| Design section | 8 (Trust Boundaries) |
| Dependencies | 1.3 |
| Blocks demo | Yes |
| Files | `scripts/generate-keys.ts`, documentation in README |

**Objective:** Script that:
- Generates Ed25519 key pair via `@noble/ed25519`.
- Outputs private key to stdout (for `.env`; never committed).
- Outputs public key hex and fingerprint.
- Documents how to pin public key in verifier build.
- `.env.example` shows placeholder for `ERILOG_SIGNING_PRIVATE_KEY`.

**Acceptance criteria:**
- Generated key pair round-trips (sign + verify).
- Script prints clear instructions.
- Private key is never written to a file in the repo.

**Test command:** `pnpm tsx scripts/generate-keys.ts`
**Expected output:** Key pair generated; instructions printed.

**VERIFY item resolved:** Ed25519 key generation workflow documented.

---

## Phase 7 — Integration, E2E, Accessibility, Security, Performance

### Task 7.1: Playwright E2E — Signature Demo [VISUAL-REFERENCE-REQUIRED]

| Field | Value |
|---|---|
| Priority | Launch Gate |
| Requirements | REQ-JDG-2, REQ-JDG-3, REQ-OFF-1, REQ-OFF-10 |
| Invariants | All |
| Design section | All |
| Dependencies | Phase 5, Phase 6 |
| Blocks demo | Yes |
| Files | `apps/web/tests/e2e/signature-demo.spec.ts` |

**Objective:** Playwright test that executes the full signature demo:
1. Navigate to Judge Mode URL.
2. Open Alpha operator, go offline, record 2 events, verify persistence on reload.
3. Open Bravo operator, go offline, record 2 events.
4. Go online, sync both devices.
5. Verify coordinator shows 4/96/3/1 exception.
6. Export bundle, download.
7. Open verifier, load bundle → PASS.
8. Tamper Lab → FAIL with diagnostic.

**Acceptance criteria:**
- Test passes in Chromium.
- Offline simulation uses `page.context().setOffline(true)`.
- All assertions match seed-42 contract values.
- Test completes in < 90 seconds.

**Test command:** `pnpm playwright test -- signature-demo`
**Expected output:** 1 test passed.

---

### Task 7.2: Integration Tests — Sync Edge Cases

| Field | Value |
|---|---|
| Priority | Launch Gate |
| Requirements | REQ-SYN-1, REQ-SYN-2, REQ-SYN-3, REQ-SYN-8 |
| Invariants | INV-001, INV-002, INV-003 |
| Design section | 5.4 |
| Dependencies | 4.1 |
| Blocks demo | No |
| Files | `apps/web/tests/integration/sync-edge-cases.test.ts` |

**Objective:** Integration tests against real PostgreSQL:
- Idempotent replay (same content) → `already_seen`.
- Event ID collision (different content) → `EVENT_ID_COLLISION`.
- Sequence gap → `SEQUENCE_GAP`.
- Chain break → `CHAIN_BREAK`.
- Hash mismatch → `HASH_MISMATCH`.
- Unauthorized device → 401.
- Reverse sync order → same reconciliation result.

**Acceptance criteria:** All edge cases produce correct response codes and do not corrupt state.

**Test command:** `pnpm --filter web test -- sync-edge`
**Expected output:** All sync edge case tests pass.

---

### Task 7.3: Accessibility Audit [VISUAL-REFERENCE-REQUIRED]

| Field | Value |
|---|---|
| Priority | Launch Gate |
| Requirements | REQ-NFR (A11Y from PRD: NFR-A11Y-001 through 006) |
| Invariants | — |
| Design section | — |
| Dependencies | Phase 5 |
| Blocks demo | No (blocks submission) |
| Files | `apps/web/tests/a11y/accessibility.test.ts`, results report |

**Objective:**
- Run axe-core against all critical views (coordinator, operator, verifier).
- Keyboard-only navigation through complete demo flow.
- Verify: no color-only status, visible focus, text labels on all states, 200% zoom works.
- Document findings; fix critical issues.

**Acceptance criteria:**
- axe-core reports 0 critical violations on critical flows.
- Keyboard-only demo path completes without trap.
- States (offline, pending, synced, quarantined, exception) have text labels.

**Test command:** `pnpm --filter web test -- a11y`
**Expected output:** 0 critical violations.

**VERIFY item resolved:** WCAG 2.2 AA manual audit performed (findings documented, conformance not claimed without full audit).

---

### Task 7.4: Security Hardening

| Field | Value |
|---|---|
| Priority | Launch Gate |
| Requirements | REQ-NFR-5, REQ-NFR-6, REQ-NFR-7 |
| Invariants | INV-009, INV-010 |
| Design section | 8, 9 |
| Dependencies | 4.1, 6.1, 6.2 |
| Blocks demo | No (blocks submission) |
| Files | Various API routes, verifier parsing |

**Objective:**
- Verify no secrets in git history (`git log --all -p | grep` for key patterns).
- Verify ZIP parsing limits enforced (file count, size, ratio, path traversal).
- Verify server validates all fields independently.
- Verify auth gate checked before resource reveal.
- Verify no PII in event schema or exported bundles.
- Verify cookie settings (__Host-, HttpOnly, SameSite, expiry).

**Acceptance criteria:**
- Security checklist passes all items.
- Malformed/malicious ZIPs rejected with safe error messages.
- No secret material in any committed file or bundle.

**Test command:** `pnpm --filter web test -- security && pnpm --filter verifier test -- security`
**Expected output:** All security tests pass.

---

### Task 7.5: Performance Validation

| Field | Value |
|---|---|
| Priority | Launch Gate |
| Requirements | NFR-PER-001 through NFR-PER-004 (from PRD) |
| Invariants | — |
| Design section | — |
| Dependencies | Phase 5, Phase 6 |
| Blocks demo | No |
| Files | `scripts/perf-benchmark.ts`, results documentation |

**Objective:**
- Measure token lookup + event confirmation latency (target: < 300ms p95 for demo dataset).
- Measure reconciliation of 10,000 synthetic events (target: < 2s).
- Measure verifier processing of 10 MB bundle (target: < 3s).
- Document actual measurements in README.
- Remove or qualify any unmet targets.

**Acceptance criteria:**
- Measurements taken and documented.
- Any unmet targets noted honestly in README (not claimed as met).

**Test command:** `pnpm tsx scripts/perf-benchmark.ts`
**Expected output:** Measurements printed; targets met or honestly documented.

**VERIFY item resolved:** Performance targets measured or removed from claims.

---

## Phase 8 — Documentation, Deployment, and Submission

### Task 8.1: README and Setup Guide

| Field | Value |
|---|---|
| Priority | Launch Gate |
| Requirements | REQ-JDG-1, REQ-JDG-3 (from PRD: FR-JDG-003) |
| Invariants | — |
| Design section | — |
| Dependencies | All prior phases |
| Blocks demo | No (blocks submission) |
| Files | `README.md`, `JUDGE-TESTING.md` |

**Objective:**
- Complete README with: project description, hosted link, fresh-clone setup (< 5 min), testing instructions, architecture overview, costs/dependencies, attribution, limitations, Kiro process link.
- `JUDGE-TESTING.md` with step-by-step judge walkthrough.
- Every command tested from clean clone.
- No placeholders remaining.

**Acceptance criteria:**
- Fresh-clone setup works in < 5 minutes (excluding Docker image download).
- All links resolve.
- No `VERIFY` or `TODO` placeholders.
- Hosted URL accessible without auth.

**Test command:** Follow JUDGE-TESTING.md from scratch.
**Expected output:** Demo completes exactly as documented.

**VERIFY item resolved:** Free-tier hosting limits documented in README.

---

### Task 8.2: Deployment [VISUAL-REFERENCE-REQUIRED]

| Field | Value |
|---|---|
| Priority | Launch Gate |
| Requirements | REQ-JDG-1 |
| Invariants | — |
| Design section | — |
| Dependencies | All prior phases |
| Blocks demo | Yes |
| Files | Deployment configuration (Vercel/Railway/Fly.io), `Dockerfile` |

**Objective:**
- Deploy Next.js app to hosting provider (free tier).
- Deploy static verifier to separate static host (e.g., Vercel static, Netlify, GitHub Pages).
- PostgreSQL on free tier (Neon, Supabase, or Railway).
- Verify Judge Mode works on deployed instance.
- Document all provider choices and limits in README.

**Acceptance criteria:**
- Public URL reaches Judge Mode without signup.
- Verifier accessible at separate URL.
- Deployment smoke test passes.

**Test command:** `pnpm tsx scripts/smoke-test.ts --url=<deployed>`
**Expected output:** All smoke test steps pass.

---

### Task 8.3: Demo Video Assets [VISUAL-REFERENCE-REQUIRED]

| Field | Value |
|---|---|
| Priority | Launch Gate |
| Requirements | From PRD §14.1 |
| Invariants | — |
| Design section | — |
| Dependencies | 8.1, 8.2 |
| Blocks demo | No (blocks submission) |
| Files | Demo recording, submission materials |

**Objective:**
- Record demo video showing the signature demo flow.
- Video matches exactly what the deployed app does.
- No features shown that don't exist.
- Kiro usage visible (specs, steering, hooks).

**Acceptance criteria:**
- Video shows real deployed app, not mockup.
- All claims in video verified against test output.
- Duration appropriate for hackathon submission.

**Test command:** Manual review.
**Expected output:** Video matches reality.

---

### Task 8.4: Final Truth Audit

| Field | Value |
|---|---|
| Priority | Launch Gate |
| Requirements | From PRD §15 (Launch Gates) |
| Invariants | All |
| Design section | — |
| Dependencies | All |
| Blocks demo | Yes (final gate) |
| Files | Audit report document |

**Objective:** Run all PRD launch gates:
1. Seed-42 flow 3× consecutive ✓
2. Reverse sync order ✓
3. Offline reload preserves events ✓
4. Duplicate sync doesn't alter totals ✓
5. Valid bundle passes offline ✓
6. Tampered bundle fails with diagnostic ✓
7. Fresh-clone commands work ✓
8. Hosted links public, no auth ✓
9. No secrets in repo history ✓
10. README/video/app/tests agree on scope ✓
11. `.kiro` directory contains real materials ✓
12. Eligibility confirmed ✓

**Acceptance criteria:** All 12 gates pass.

**Test command:** Manual + automated checks.
**Expected output:** All gates green.

---

## Phase 9 — Post-Demo and Roadmap (Clearly Labelled)

### Task 9.1: Exception Resolution UI (P1)

| Field | Value |
|---|---|
| Priority | Roadmap |
| Requirements | REQ-EXC-1, REQ-EXC-2, REQ-EXC-3 |
| Invariants | INV-007 |
| Design section | 2.6 |
| Dependencies | Phase 5 |
| Blocks demo | No |
| Files | `apps/web/app/(coordinator)/exceptions/resolve/` |

**Objective:** Coordinator can resolve exceptions by appending a resolution record (actor, disposition, reason, source event references). Source events remain unmodified. Stock unchanged by resolution.

---

### Task 9.2: QR Code Scanning (P1)

| Field | Value |
|---|---|
| Priority | Roadmap |
| Requirements | REQ-OFF-2 |
| Invariants | — |
| Design section | — |
| Dependencies | 5.4 |
| Blocks demo | No |
| Files | QR scanning component |

**Objective:** Camera-based QR code scanning as alternative to manual entry. Falls back gracefully if permission denied.

---

### Task 9.3: Service Worker Install Prompt (P1)

| Field | Value |
|---|---|
| Priority | Roadmap |
| Requirements | REQ-OFF-12 |
| Invariants | — |
| Design section | 12 |
| Dependencies | 5.1 |
| Blocks demo | No |
| Files | Install prompt component |

**Objective:** PWA install prompt for adding to home screen. Offline-ready indicator.

---

### Task 9.4: Downloadable Sample Bundles (P1)

| Field | Value |
|---|---|
| Priority | Roadmap |
| Requirements | — |
| Invariants | — |
| Design section | — |
| Dependencies | 6.1 |
| Blocks demo | No |
| Files | Pre-generated sample bundles |

**Objective:** Pre-generated valid and tampered bundles available for download without running the full flow.

---

### Task 9.5: High-Contrast Theme and Reduced Motion (P1)

| Field | Value |
|---|---|
| Priority | Roadmap |
| Requirements | NFR-A11Y-001 through 006 |
| Invariants | — |
| Design section | — |
| Dependencies | Phase 5 |
| Blocks demo | No |
| Files | Theme configuration, CSS |

**Objective:** High-contrast mode, skip links, reduced-motion media query support.

---

### Task 9.6: Verification Report Download (P1)

| Field | Value |
|---|---|
| Priority | Roadmap |
| Requirements | REQ-AUD-7 (P1 in PRD) |
| Invariants | — |
| Design section | — |
| Dependencies | 6.2 |
| Blocks demo | No |
| Files | Verifier report generation |

**Objective:** Downloadable verification report (JSON/text) with verifier version, bundle ID, timestamp, checks, result.

---

### Task 9.7: Docker Compose Full Local Environment (P1)

| Field | Value |
|---|---|
| Priority | Roadmap |
| Requirements | — |
| Invariants | — |
| Design section | — |
| Dependencies | All |
| Blocks demo | No |
| Files | `docker-compose.full.yml` |

**Objective:** Single `docker compose up` that runs PostgreSQL + Next.js app + verifier for fully local evaluation.

---

---

## Signature-Demo Readiness Checklist

`[x]` means verified with a named artifact. `[ ]` means not yet verified, with the
reason stated. Nothing is checked on the basis of "it should work".

- [x] Seed-42 UUIDs, hashes, and expected results frozen in fixtures — `packages/crypto/fixtures/seed-42-vectors.json`
- [x] `reconcile(seed42Input)` produces byte-exact expected output — `packages/reconcile/tests/seed-42.test.ts`
- [x] Property tests pass — 8 properties in `reconcile.property.test.ts`. Corrected: generated cases are 50–200 per property, not 1000. The original 1000 figure was never true.
- [x] PostgreSQL migrations apply cleanly — applied to a throwaway `postgres:15-alpine` container and in CI
- [x] Sync accepts 4 events and produces correct snapshot — verified on the hosted deployment
- [x] Reverse sync order produces identical snapshot — property P1 (`fc.shuffledSubarray`) plus headless proof step 10
- [x] Duplicate sync (replay) returns `already_seen`, no state change — headless proof step 5
- [x] Coordinator view shows 4 distributed, 96 remaining, 1 exception, 2 peer events — verified on the hosted deployment
- [x] Exception displays NO winner/original/duplicate designation — `ExceptionRecord` has no `winnerId`/`originalId` field
- [x] Export produces valid signed ZIP with all manifest fields — verified by exporting from hosted Judge Mode
- [x] Verifier passes valid bundle with "PASS — all checks passed" — headless proof step 9 and `/verify` (7 layers)
- [x] Tamper Lab (qty 1→2) produces FAIL with file checksum diagnostic — headless proof step 10 and the `/verify` tamper test, which names `file_checksum · events.json`
- [ ] Verifier works with network disabled — verification itself is client-side and uploads nothing, but this has not been tested with the network cut after page load. Pinning the key from `/api/public-key` does require network; pasting a key does not.
- [ ] Offline recording survives page reload — an E2E test covers this, but that spec is stale (asserts UI strings that no longer exist), so the claim is currently unverified
- [x] "Recorded on this device — pending sync" — no approval language anywhere — operator receipt reads "Recorded HH-040 on this device" / "Pending sync · this is not global approval."
- [x] Judge Mode reachable from public URL, no signup — `https://erilog-kiro.vercel.app/judge`
- [x] Reset returns exact seed-42 state — `DELETE /api/judge` restores device sequences to 0
- [ ] Full flow completes in ≤ 90 seconds — not measured under observation; no timing evidence recorded

---

## Submission Eligibility Checklist

- [ ] All 12 PRD launch gates pass (Task 8.4) — not audited gate by gate against `docs/product/PRD.md`
- [x] No paid dependencies required for local or hosted evaluation — no runtime third-party API calls; ElevenLabs was used only to generate the demo film's score and its output is committed
- [x] README contains no placeholders or VERIFY items — remaining `VERIFY` matches are Mermaid diagram node labels
- [ ] Every command in JUDGE-TESTING.md executed from clean environment — that file does not exist. The equivalent was done for the headline path: `pnpm install --frozen-lockfile && pnpm demo:headless` was run from a clean `git clone`, which is what exposed the missing build step.
- [x] Video shows only shipped functionality — product frames are captures of the running app; the close states limitations explicitly
- [x] `.kiro/` directory contains real specs, steering, hooks used during development — spec, 2 steering files, and the post-save quality-gate hook
- [x] No secrets, PII, or private keys in repository history — `.env` files are ignored; entitlement tokens are synthetic; the signing key in `ci.yml` is the published RFC 8032 Ed25519 test vector, not a production secret
- [x] Hosting URLs stable and public — `erilog-kiro.vercel.app`, no deployment protection
- [x] Performance claims backed by measurements — `apps/web/tests/perf/performance.test.ts` prints timings per run
- [x] Accessibility findings documented honestly — the axe suite audits 4 pages for critical and serious violations; the README states full WCAG conformance needs manual and assistive-technology testing
- [ ] Attribution and costs documented — supplied in the submission form, not yet written into the repository
- [ ] Participant eligibility confirmed under official rules — owner confirmation, cannot be verified from the repository

---

## Requirement and Invariant Coverage Matrix

| Req/Inv | Phase | Task(s) | Test Type |
|---|---|---|---|
| REQ-MIS-1 | 1, 3 | 1.1, 3.1, 5.3 | Unit, Integration |
| REQ-MIS-2 | 1 | 1.1 | Unit (Zod) |
| REQ-MIS-3 | 3 | 3.1, 5.3 | Integration |
| REQ-MIS-4 | 3 | 3.1, 5.3 | Integration |
| REQ-MIS-5 | 1, 3 | 1.3, 3.4 | Unit, Integration |
| REQ-MIS-6 | 3 | 3.2 | Integration |
| REQ-MIS-7 | 5 | 5.2 | Integration, E2E |
| REQ-MIS-8 | 3, 5 | 3.4, 5.2 | Integration |
| REQ-OFF-1 | 4, 5 | 4.3, 5.4 | Unit, E2E |
| REQ-OFF-2 | 5 | 5.4 | Unit |
| REQ-OFF-3 | 4 | 4.3 | Unit |
| REQ-OFF-4 | 1 | 1.1, 1.3 | Unit (golden vectors) |
| REQ-OFF-5 | 1 | 1.3 | Unit |
| REQ-OFF-6 | 4 | 4.3 | Unit |
| REQ-OFF-7 | 5 | 5.4 | E2E |
| REQ-OFF-8 | 5 | 5.4 | E2E (absence test) |
| REQ-OFF-9 | 5 | 5.4 | E2E |
| REQ-OFF-10 | 4 | 4.3 | Unit |
| REQ-OFF-11 | 4 | 4.4 | Unit |
| REQ-OFF-12 | 5 | 5.1 | E2E |
| REQ-OFF-13 | 4 | 4.3 | Unit |
| REQ-SYN-1 | 4 | 4.1 | Integration |
| REQ-SYN-2 | 4 | 4.1 | Integration |
| REQ-SYN-3 | 4 | 4.1 | Integration |
| REQ-SYN-4 | 2 | 2.1, 2.2 | Unit, Property |
| REQ-SYN-5 | 2 | 2.1, 2.2 | Unit, Property |
| REQ-SYN-6 | 2 | 2.1, 2.2 | Unit, Property |
| REQ-SYN-7 | 2 | 2.1 | Unit |
| REQ-SYN-8 | 2, 4 | 2.1, 4.1 | Unit, Integration |
| REQ-SYN-9 | 2 | 2.1 | Unit |
| REQ-SYN-10 | 4 | 4.1, 4.2 | Integration, Unit |
| REQ-SYN-11 | 4 | 4.2, 5.4 | Unit, E2E |
| REQ-SYN-12 | 3 | 3.3 | Integration |
| REQ-SYN-13 | 4 | 4.2 | Unit |
| REQ-SYN-14 | 4 | 4.1 | Integration |
| REQ-AUD-1 | 6 | 6.1 | Integration |
| REQ-AUD-2 | 6 | 6.2 | Unit |
| REQ-AUD-3 | 6 | 6.1, 6.2 | Integration, Unit |
| REQ-AUD-4 | 6 | 6.2 | Unit |
| REQ-AUD-5 | 6 | 6.2, 6.4 | Unit |
| REQ-AUD-6 | 6 | 6.2 | Unit |
| REQ-AUD-7 | 6 | 6.2 | Unit |
| REQ-AUD-8 | 6 | 6.3 | Unit |
| REQ-JDG-1 | 5 | 5.2 | E2E |
| REQ-JDG-2 | 2, 3, 5 | 2.3, 3.4, 5.5 | Snapshot, E2E |
| REQ-JDG-3 | 7 | 7.1 | E2E (timing) |
| REQ-JDG-4 | 5 | 5.2 | Integration |
| REQ-EXC-1 | 9 | 9.1 | Integration |
| REQ-EXC-2 | 9 | 9.1 | Integration |
| REQ-EXC-3 | 2, 9 | 2.2, 9.1 | Property |
| REQ-NFR-1 | 4 | 4.3 | Unit |
| REQ-NFR-2 | 4 | 4.2 | Unit |
| REQ-NFR-3 | 1 | 1.1 | Unit (schema inspection) |
| REQ-NFR-4 | 1 | 1.3 | Unit |
| REQ-NFR-5 | 4 | 4.1 | Integration |
| REQ-NFR-6 | 6, 7 | 6.4, 7.4 | Manual, Integration |
| REQ-NFR-7 | 6, 7 | 6.2, 7.4 | Unit |
| INV-001 | 2, 3, 4 | 2.2, 3.3, 4.1 | Property, Integration |
| INV-002 | 2, 4 | 2.2, 4.1 | Property, Integration |
| INV-003 | 2 | 2.2 | Property |
| INV-004 | 2 | 2.2 | Property |
| INV-005 | 2 | 2.2 | Property |
| INV-006 | 3, 4 | 3.2, 4.3 | Integration, Unit |
| INV-007 | 2, 9 | 2.2, 9.1 | Property |
| INV-008 | 6 | 6.1, 6.2 | Integration, Unit |
| INV-009 | 1, 6 | 1.3, 6.2, 6.3 | Unit, Property |
| INV-010 | 1 | 1.1 | Unit |

---

## Full-Vision Roadmap

| Capability | Priority | Dependency | Status |
|---|---|---|---|
| Exception resolution with dispositions | P1 | Phase 5 | Task 9.1 |
| QR code camera scanning | P1 | Phase 5 | Task 9.2 |
| PWA install prompt | P1 | Phase 5 | Task 9.3 |
| Downloadable sample bundles | P1 | Phase 6 | Task 9.4 |
| High-contrast / reduced-motion | P1 | Phase 5 | Task 9.5 |
| Verification report download | P1 | Phase 6 | Task 9.6 |
| Docker Compose full environment | P1 | All | Task 9.7 |
| Multi-item missions | P2 | Reconcile engine | — |
| Cross-organization deduplication | P2 | Identity layer | — |
| Key pinning via certificate transparency | P2 | PKI infrastructure | — |
| Correction-event type (undo without delete) | P2 | Event schema v2 | — |
| Production RBAC and multi-tenant | P2 | Auth service | — |
| Mobile-native app (React Native) | P2 | Shared reconcile pkg | — |
| Real-time sync via WebSocket | P2 | Server infra | — |
| Audit timeline visualization | P2 | Snapshot history | — |
| Bulk import from CSV/paper records | P2 | Event adapter | — |

---

## Tasks Safe to Defer Without Misrepresenting Functionality

These tasks can be deferred from the hackathon submission without creating false claims, as long as the README/video do not reference them as shipped:

| Task | Why safe to defer |
|---|---|
| 9.1 Exception Resolution UI | PRD marks as P1/SHOULD SHIP; core demo works without it |
| 9.2 QR Scanning | Manual entry is the primary path; QR is convenience |
| 9.3 Install Prompt | PWA works without explicit install prompt |
| 9.4 Sample Bundles | Judge can generate bundles through the demo flow |
| 9.5 High-Contrast/Motion | A11Y audit documents gaps honestly; no false WCAG claim |
| 9.6 Report Download | Verifier shows results on screen; download is convenience |
| 9.7 Docker Full Env | Fresh-clone works with docker compose for DB only |
| 7.5 Performance Validation | Remove unverified claims from README rather than defer silently |

Tasks that are NOT safe to defer (misrepresentation risk if skipped):
- Any Phase 0–6 Core task (the guarantee breaks)
- Task 7.1 E2E (launch gate; proves the demo works)
- Task 8.1 README (judges need it)
- Task 8.4 Final Truth Audit (prevents false claims)
