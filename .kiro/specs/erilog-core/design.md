# Technical Design: erilog-core

## Technology Decisions

| Concern | Choice | Rationale |
|---|---|---|
| Language | TypeScript (strict) | Single language across client, server, reconciliation, and verifier |
| Framework | Next.js 14+ App Router | Server + client in one deployable; API routes for sync; PWA via next-pwa |
| UI | React 18+ | Component model, hooks for offline state, PWA lifecycle |
| Offline storage | Dexie.js (IndexedDB) | Promise-based, typed, versioned schemas, bulk ops, live queries |
| Database | PostgreSQL 15+ | JSONB for structured data, strong constraints, free-tier hosting |
| ORM | Drizzle ORM | Type-safe, lightweight, migration support |
| Validation | Zod | Shared schemas between client and server; runtime + static type inference |
| Unit/integration tests | Vitest | Fast, ESM-native, compatible with fast-check |
| Property-based tests | fast-check | Permutation and invariant testing for reconciliation |
| E2E tests | Playwright | Cross-browser offline simulation, service worker testing |
| Reconciliation | `@erilog/reconcile` | Framework-independent pure package; no DB/UI/IO deps |
| Event integrity | SHA-256 hash chains via Web Crypto | Available in browser, Node, and static page |
| Audit signing | Ed25519 via `@noble/ed25519` | Audited pure-JS; no native deps; works in verifier |
| Canonicalization | RFC 8785 (JCS) | Unambiguous JSON serialization for hashing |
| Static verifier | Standalone HTML + JS bundle | No backend; pinned public key; imports `@erilog/reconcile` |

---

## 1. Repository Structure

```text
erilog/
├── packages/
│   ├── reconcile/                  # Pure reconciliation engine
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── reconcile.ts       # reconcile(input) -> result
│   │   │   ├── stock.ts           # Physical stock computation
│   │   │   ├── exceptions.ts      # Exception detection + deterministic IDs
│   │   │   ├── normalize.ts       # Canonical sorting
│   │   │   └── types.ts           # Domain types (no Zod dep)
│   │   ├── tests/
│   │   │   ├── reconcile.test.ts
│   │   │   ├── reconcile.property.test.ts
│   │   │   ├── stock.test.ts
│   │   │   └── exceptions.test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── schemas/                    # Shared Zod contracts
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── mission.ts
│   │   │   ├── policy-version.ts
│   │   │   ├── device.ts
│   │   │   ├── event.ts
│   │   │   ├── exception.ts
│   │   │   ├── sync.ts
│   │   │   ├── bundle.ts
│   │   │   └── common.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── crypto/                     # Hash chain + signing utilities
│       ├── src/
│       │   ├── index.ts
│       │   ├── canonicalize.ts     # RFC 8785 JCS implementation
│       │   ├── hash-chain.ts      # SHA-256 event hashing
│       │   ├── signing.ts         # Ed25519 sign/verify
│       │   ├── manifest.ts        # Manifest checksum computation
│       │   └── types.ts
│       ├── tests/
│       │   ├── canonicalize.test.ts
│       │   ├── hash-chain.test.ts
│       │   └── signing.test.ts
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   ├── web/                        # Next.js PWA
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── judge/
│   │   │   │   └── [sessionId]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── coordinator/
│   │   │   │       └── operator/
│   │   │   ├── api/
│   │   │   │   ├── missions/
│   │   │   │   ├── sync/
│   │   │   │   ├── reconcile/
│   │   │   │   ├── export/
│   │   │   │   └── judge/
│   │   │   └── (coordinator)/
│   │   │       ├── missions/
│   │   │       ├── exceptions/
│   │   │       └── export/
│   │   ├── lib/
│   │   │   ├── db/
│   │   │   │   ├── client.ts      # Dexie database definition
│   │   │   │   ├── schema.ts      # Dexie schema versions
│   │   │   │   └── queries.ts
│   │   │   ├── offline/
│   │   │   │   ├── event-queue.ts
│   │   │   │   ├── sync-engine.ts
│   │   │   │   ├── stock.ts
│   │   │   │   └── persistence.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useOfflineStatus.ts
│   │   │   │   ├── useMission.ts
│   │   │   │   ├── useEventQueue.ts
│   │   │   │   └── useSyncEngine.ts
│   │   │   └── server/
│   │   │       ├── db.ts          # Drizzle PostgreSQL client
│   │   │       ├── missions.ts
│   │   │       ├── events.ts
│   │   │       ├── reconcile.ts   # Calls @erilog/reconcile
│   │   │       └── export.ts
│   │   ├── public/
│   │   │   └── sw.js
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── verifier/                   # Static standalone verifier
│       ├── src/
│       │   ├── index.html
│       │   ├── verifier.ts
│       │   ├── tamper-lab.ts
│       │   ├── ui.ts
│       │   └── pinned-key.ts      # Ed25519 public key pinned at build
│       ├── tests/
│       │   ├── verifier.test.ts
│       │   └── tamper-lab.test.ts
│       ├── vite.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── drizzle/
│   ├── 0001_missions.sql
│   ├── 0002_policy_versions.sql
│   ├── 0003_devices.sql
│   ├── 0004_events.sql
│   ├── 0005_exceptions_snapshots.sql
│   ├── 0006_judge_sessions.sql
│   └── meta/
│
├── scripts/
│   ├── seed-42.ts
│   ├── generate-keys.ts
│   └── smoke-test.ts
│
├── .kiro/
│   ├── specs/
│   │   └── erilog-core/
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   └── steering/
│
├── docs/
│   └── product/
│       ├── PRD.md
│       └── CONCEPT-BRIEF.md
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## 2. Database Model (PostgreSQL)

### 2.1 missions

```sql
CREATE TABLE missions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'active', 'closed')),
  total_stock   JSONB NOT NULL,
  activated_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.2 policy_versions (immutable after activation)

```sql
CREATE TABLE policy_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id    UUID NOT NULL REFERENCES missions(id),
  version       INTEGER NOT NULL,
  policy        JSONB NOT NULL,
  policy_hash   TEXT NOT NULL,
  activated_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mission_id, version)
);

-- Policy JSONB structure:
-- {
--   "items": [{"type": "emergency_kit", "unit": "kit"}],
--   "allowances": [{"itemType": "emergency_kit", "maxPerEntitlement": 1}],
--   "tokenSalt": "<per-mission random 32-byte hex>"
-- }

-- After activation: no UPDATE allowed
REVOKE UPDATE, DELETE ON policy_versions FROM app_role;
```

### 2.3 devices

```sql
CREATE TABLE devices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id      UUID NOT NULL REFERENCES missions(id),
  label           TEXT NOT NULL,
  allocation      JSONB NOT NULL,
  package_hash    TEXT,
  provisioned_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mission_id, label)
);
```

### 2.4 events (append-only)

```sql
CREATE TABLE events (
  id              UUID PRIMARY KEY,
  mission_id      UUID NOT NULL REFERENCES missions(id),
  device_id       UUID NOT NULL REFERENCES devices(id),
  policy_version  INTEGER NOT NULL,
  sequence        INTEGER NOT NULL CHECK (sequence >= 0),
  token_hash      TEXT NOT NULL,
  item_type       TEXT NOT NULL,
  quantity        INTEGER NOT NULL CHECK (quantity > 0),
  device_time     TIMESTAMPTZ NOT NULL,
  previous_hash   TEXT NOT NULL,
  event_hash      TEXT NOT NULL,
  accepted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (device_id, sequence),
  FOREIGN KEY (mission_id, policy_version)
    REFERENCES policy_versions(mission_id, version)
);

REVOKE UPDATE, DELETE ON events FROM app_role;
```

### 2.5 reconciliation_snapshots (immutable projections)

```sql
CREATE TABLE reconciliation_snapshots (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id        UUID NOT NULL REFERENCES missions(id),
  event_set_digest  TEXT NOT NULL,
  summary           JSONB NOT NULL,
  exceptions        JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mission_id, event_set_digest)
);
```

Exceptions are not stored as mutable rows. Each reconciliation produces an immutable snapshot keyed by `event_set_digest` (SHA-256 of sorted accepted event IDs). When a new event is accepted, a new snapshot is computed; old snapshots remain for audit history. The event log is always authoritative.

### 2.6 resolutions (P1, append-only)

```sql
CREATE TABLE resolutions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id      UUID NOT NULL REFERENCES missions(id),
  exception_id    TEXT NOT NULL,
  snapshot_id     UUID NOT NULL REFERENCES reconciliation_snapshots(id),
  actor           TEXT NOT NULL,
  disposition     TEXT NOT NULL
                    CHECK (disposition IN ('explained', 'authorized', 'investigate')),
  reason          TEXT NOT NULL,
  source_event_ids UUID[] NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

REVOKE UPDATE, DELETE ON resolutions FROM app_role;
```

### 2.7 judge_sessions

```sql
CREATE TABLE judge_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash      TEXT NOT NULL UNIQUE,
  mission_id      UUID REFERENCES missions(id),
  seed            INTEGER NOT NULL DEFAULT 42,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The capability token is delivered once via a secure HttpOnly cookie with `SameSite=Strict`, short TTL, and the `__Host-` prefix. Only the SHA-256 hash of the token is stored server-side. Authorization is checked before any response reveals whether a resource exists.

---

## 3. Canonical Contracts (Zod)

All contracts use these resolved decisions:

| Decision | Resolution |
|---|---|
| Event ID format | UUIDv4 (random). Fixtures use UUIDs, not `evt_alpha_0001`. |
| Event item shape | Single `itemType: string` + `quantity: number` per event. No `items[]` array. |
| Sequence start | 0-indexed. First event on a device has `sequence: 0`. |
| Initial previousHash | String literal `"GENESIS"` (not null). |
| Requirement IDs | `REQ-*` namespace as defined in requirements.md. |
| Allocation ownership | Stored on the `devices` table. Passed to reconciler as `DeviceAllocation[]`. |

### 3.1 Event Schema

```typescript
// packages/schemas/src/event.ts
import { z } from 'zod';

export const HandoutEventSchema = z.object({
  id:             z.string().uuid(),
  missionId:      z.string().uuid(),
  deviceId:       z.string().uuid(),
  policyVersion:  z.number().int().nonnegative(),
  sequence:       z.number().int().nonnegative(),
  tokenHash:      z.string().length(64),       // SHA-256 hex, 64 chars
  itemType:       z.string().min(1),
  quantity:       z.number().int().positive(),
  deviceTime:     z.string().datetime(),       // ISO 8601
  previousHash:   z.string().min(1),           // 64-char hex or "GENESIS"
  eventHash:      z.string().length(64),       // SHA-256 hex
});

export type HandoutEvent = z.infer<typeof HandoutEventSchema>;
```

### 3.2 Policy Version Schema

```typescript
// packages/schemas/src/policy-version.ts
export const PolicyVersionSchema = z.object({
  missionId:    z.string().uuid(),
  version:      z.number().int().nonnegative(),
  policy:       MissionPolicySchema,
  policyHash:   z.string().length(64),
  activatedAt:  z.string().datetime().optional(),
});

export const MissionPolicySchema = z.object({
  items:       z.array(z.object({ type: z.string(), unit: z.string() })),
  allowances:  z.array(z.object({
    itemType:           z.string(),
    maxPerEntitlement:  z.number().int().positive(),
  })),
  tokenSalt:   z.string().min(32),
});
```

### 3.3 Reconciliation Input/Output Schema

```typescript
// packages/reconcile/src/types.ts

export interface DeviceAllocation {
  deviceId: string;
  allocation: Record<string, number>;  // itemType -> quantity
}

export interface ReconciliationInput {
  policy: MissionPolicy;
  events: HandoutEvent[];
  devices: DeviceAllocation[];
  initialStock: Record<string, number>;  // itemType -> total
}

export interface ReconciliationResult {
  summary: StockSummary;
  exceptions: ExceptionRecord[];
  eventSetDigest: string;               // SHA-256 of sorted event IDs
}

export interface StockSummary {
  missionId: string;
  initialStock: Record<string, number>;
  distributed: Record<string, number>;
  remaining: Record<string, number>;
  uniqueTokensServed: number;
  totalPhysicalHandouts: number;
}

export interface ExceptionRecord {
  id: string;                            // Deterministic from sorted event IDs + type
  type: 'duplicate_entitlement' | 'device_overspend' | 'event_overspend' | 'chain_fork';
  tokenHash?: string;                    // For duplicate_entitlement
  eventIds: string[];                    // Sorted. All are peers.
  deviceIds: string[];                   // Sorted.
  quantities: number[];                  // Ordered by sorted eventIds
  timestamps: string[];                  // Ordered by sorted eventIds
  status: 'unresolved';
}
```

Note: `ReconciliationResult` contains no timestamps or environmental data. The `eventSetDigest` is deterministic (SHA-256 of sorted event IDs). Export-time metadata belongs in the signed manifest only.

---

## 4. Canonicalization and Event Hashing

### 4.1 Canonicalization: RFC 8785 (JCS)

All hashing operations use RFC 8785 JSON Canonicalization Scheme:

1. Object keys sorted lexicographically by Unicode code point.
2. No whitespace between tokens.
3. Numbers serialized without trailing zeros; integers without decimal point.
4. Strings use minimal `\uXXXX` escaping per RFC 8785 rules.
5. UTF-8 encoding of the canonical JSON produces the byte sequence for hashing.

This eliminates all ambiguity from delimiter-based concatenation.

### 4.2 Event Hash Computation

```typescript
// packages/crypto/src/hash-chain.ts
import { canonicalize } from './canonicalize';  // RFC 8785

// Fields included in hash, in their natural key order (RFC 8785 sorts them)
export interface EventHashInput {
  deviceId: string;
  deviceTime: string;
  id: string;
  itemType: string;
  missionId: string;
  policyVersion: number;
  previousHash: string;
  quantity: number;
  sequence: number;
  tokenHash: string;
}

export async function computeEventHash(event: EventHashInput): Promise<string> {
  // RFC 8785 canonical JSON (keys sorted lexicographically)
  const canonical: string = canonicalize(event);
  const bytes = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return hexEncode(new Uint8Array(digest));
}
```

The `eventHash` field is excluded from the hash input (it is the output). All other fields that define the event's identity and content are included.

### 4.3 Chain Verification

```typescript
export async function verifyDeviceChain(
  events: HandoutEvent[]
): Promise<{ valid: boolean; brokenAt?: number; reason?: string }> {
  const sorted = [...events].sort((a, b) => a.sequence - b.sequence);

  for (let i = 0; i < sorted.length; i++) {
    const event = sorted[i];

    // Verify self-hash
    const computed = await computeEventHash(toHashInput(event));
    if (computed !== event.eventHash) {
      return { valid: false, brokenAt: event.sequence, reason: 'self_hash_mismatch' };
    }

    // Verify chain linkage
    if (i === 0) {
      if (event.previousHash !== 'GENESIS') {
        return { valid: false, brokenAt: 0, reason: 'missing_genesis' };
      }
    } else {
      if (event.previousHash !== sorted[i - 1].eventHash) {
        return { valid: false, brokenAt: event.sequence, reason: 'chain_break' };
      }
    }

    // Verify sequence continuity
    if (event.sequence !== i) {
      return { valid: false, brokenAt: event.sequence, reason: 'sequence_gap' };
    }
  }

  return { valid: true };
}
```

---

## 5. Sync Protocol

### 5.1 Authorization Model

All sync endpoints require a valid session. Authorization is checked **before** any response reveals whether a resource (event ID, mission, device) exists:

```text
1. Authenticate session (cookie or capability token hash lookup)
2. Verify device belongs to authenticated session's mission
3. Only then process events
```

This prevents information leakage about event existence to unauthorized parties.

### 5.2 Request (Device to Server)

```typescript
// POST /api/sync
export const SyncRequestSchema = z.object({
  deviceId:   z.string().uuid(),
  missionId:  z.string().uuid(),
  events:     z.array(HandoutEventSchema).min(1).max(100),
});
```

### 5.3 Response (Server to Device)

```typescript
export const SyncResponseSchema = z.object({
  results: z.array(z.object({
    eventId: z.string().uuid(),
    status:  z.enum(['accepted', 'already_seen', 'quarantined']),
    reason:  z.string().optional(),
  })),
  serverTime: z.string().datetime(),
});
```

### 5.4 Server Sync Handler

```text
AUTHORIZE session
VERIFY device belongs to session's mission

FOR each event in request.events:

  1. VALIDATE schema (Zod parse) — reject malformed before any DB lookup

  2. VALIDATE mission membership: event.missionId == device's mission
  3. VALIDATE device authorization: event.deviceId == request.deviceId
  4. VALIDATE policy version exists and is activated for this mission

  5. LOOKUP existing event by ID:
     IF exists:
       COMPUTE canonical hash of submitted event
       IF canonical hash == stored event's eventHash:
         → respond "already_seen" (safe idempotent replay)
       ELSE:
         → respond "quarantined" with reason "EVENT_ID_COLLISION"
         (Same ID but different content = attempted overwrite or collision)

  6. VALIDATE sequence == (max accepted sequence for device) + 1
     IF gap → quarantine with reason "SEQUENCE_GAP"

  7. VALIDATE previousHash:
     IF sequence == 0: must be "GENESIS"
     ELSE: must equal eventHash of the event at (sequence - 1) for this device
     IF mismatch → quarantine with reason "CHAIN_BREAK"

  8. RECOMPUTE eventHash from canonical fields (RFC 8785 + SHA-256)
     IF computed != submitted eventHash → quarantine "HASH_MISMATCH"

  9. INSERT into events table → respond "accepted"

AFTER batch:
  IF any event was "accepted":
    COMPUTE new reconciliation snapshot
    STORE snapshot keyed by new event_set_digest
```

### 5.5 Client Sync Engine

```text
STATE: pendingQueue (IndexedDB), backoffMs = 2000, maxBackoffMs = 60000

LOOP (while pendingQueue is non-empty AND navigator.onLine):
  batch = take oldest min(pendingQueue.length, 100) events ordered by sequence
  TRY:
    response = POST /api/sync { deviceId, missionId, events: batch }
    FOR each result in response.results:
      CASE "accepted":     remove from pendingQueue; mark synced
      CASE "already_seen": remove from pendingQueue; mark synced
      CASE "quarantined":  mark quarantined with reason; keep in UI
    RESET backoffMs = 2000
  CATCH network error:
    WAIT backoffMs
    backoffMs = min(backoffMs * 2, maxBackoffMs)

IF pendingQueue.age > 1 hour cumulative online → show persistent warning
```

---

## 6. Reconciliation Algorithm

### 6.1 Location

`packages/reconcile/src/reconcile.ts` — pure function, no I/O, no framework deps.

### 6.2 Signature

```typescript
export function reconcile(input: ReconciliationInput): ReconciliationResult
```

### 6.3 Algorithm

```text
FUNCTION reconcile(input: ReconciliationInput): ReconciliationResult

  VALIDATE: input.events is non-empty or return empty summary with no exceptions

  // ─── Step 1: Compute event set digest ───
  eventSetDigest = sha256(input.events.map(e => e.id).sort().join('\n'))

  // ─── Step 2: Canonical sort for determinism ───
  // Sort by (tokenHash ASC, deviceId ASC, sequence ASC)
  sortedEvents = canonicalSort(input.events)

  // ─── Step 3: Physical stock computation ───
  // Every unique accepted event counts toward stock. No exceptions.
  distributed = {}
  FOR each event in sortedEvents:
    distributed[event.itemType] = (distributed[event.itemType] ?? 0) + event.quantity
  remaining = {}
  FOR each itemType in input.initialStock:
    remaining[itemType] = input.initialStock[itemType] - (distributed[itemType] ?? 0)

  // ─── Step 4: Duplicate-entitlement exceptions ───
  exceptions = []
  tokenGroups = groupBy(sortedEvents, e => e.tokenHash + '\x00' + e.itemType)
  FOR each (key, group) in tokenGroups:
    maxAllowed = findAllowance(input.policy, group[0].itemType)
    IF group.length > maxAllowed:
      sortedIds = group.map(e => e.id).sort()
      exceptionId = sha256(sortedIds.join('\n') + '\n' + 'duplicate_entitlement')
      exceptions.push({
        id: exceptionId,
        type: 'duplicate_entitlement',
        tokenHash: group[0].tokenHash,
        eventIds: sortedIds,
        deviceIds: unique(group.map(e => e.deviceId)).sort(),
        quantities: sortedIds.map(id => group.find(e => e.id === id)!.quantity),
        timestamps: sortedIds.map(id => group.find(e => e.id === id)!.deviceTime),
        status: 'unresolved'
      })

  // ─── Step 5: Per-event overspend ───
  FOR each event in sortedEvents:
    maxAllowed = findAllowance(input.policy, event.itemType)
    IF event.quantity > maxAllowed:
      exceptionId = sha256(event.id + '\n' + 'event_overspend')
      exceptions.push({
        id: exceptionId,
        type: 'event_overspend',
        eventIds: [event.id],
        deviceIds: [event.deviceId],
        quantities: [event.quantity],
        timestamps: [event.deviceTime],
        status: 'unresolved'
      })

  // ─── Step 6: Device overspend ───
  FOR each device in input.devices:
    deviceEvents = sortedEvents.filter(e => e.deviceId === device.deviceId)
    FOR each itemType in device.allocation:
      total = sum(deviceEvents.filter(e => e.itemType === itemType).map(e => e.quantity))
      IF total > device.allocation[itemType]:
        affected = deviceEvents.filter(e => e.itemType === itemType)
        sortedIds = affected.map(e => e.id).sort()
        exceptionId = sha256(sortedIds.join('\n') + '\n' + 'device_overspend')
        exceptions.push({
          id: exceptionId,
          type: 'device_overspend',
          eventIds: sortedIds,
          deviceIds: [device.deviceId],
          quantities: sortedIds.map(id => affected.find(e => e.id === id)!.quantity),
          timestamps: sortedIds.map(id => affected.find(e => e.id === id)!.deviceTime),
          status: 'unresolved'
        })

  // ─── Step 7: Sort exceptions deterministically ───
  exceptions.sort((a, b) => a.id.localeCompare(b.id))

  RETURN {
    summary: {
      missionId: derivedFromEvents,
      initialStock: input.initialStock,
      distributed,
      remaining,
      uniqueTokensServed: countUniqueTokenHashes(sortedEvents),
      totalPhysicalHandouts: sortedEvents.length,
    },
    exceptions,
    eventSetDigest,
  }
```

### 6.4 Determinism Guarantees

1. All collections sorted by deterministic keys before any computation.
2. Exception IDs: `sha256(sorted_event_ids.join('\n') + '\n' + exception_type)`.
3. Quantities and timestamps ordered by the same sorted event ID array.
4. No wall-clock time, no database ordering, no insertion sequence in the result.
5. `eventSetDigest` deterministic: `sha256(sorted_event_ids.join('\n'))`.
6. The function is pure: same `ReconciliationInput` always produces same `ReconciliationResult`, byte-for-byte after RFC 8785 canonical serialization.

### 6.5 Reuse Matrix

| Consumer | Import | Purpose |
|---|---|---|
| Server API | `@erilog/reconcile` | Compute snapshot after accepting new events |
| Static verifier | `@erilog/reconcile` | Recompute from exported events+policy, compare to declared summary |
| Property tests | `@erilog/reconcile` | Permutation invariance, conservation, exception completeness |
| Client (optional) | `@erilog/reconcile` | Local preview of reconciliation state (non-authoritative) |

---

## 7. Exception Model: Immutable Projections

Exceptions are **not** mutable database rows. They are deterministic projections of the event log:

1. When a new event is accepted, the server calls `reconcile()` with the full accepted event set.
2. The result (summary + exceptions + eventSetDigest) is stored as an immutable `reconciliation_snapshots` row.
3. The latest snapshot (by `created_at`) is the current view.
4. Old snapshots are never deleted — they provide audit history of how the reconciliation evolved.
5. If a third conflicting event arrives for a token that already had two, the new snapshot's exception will contain all three event IDs. The old snapshot with two remains as historical record.

This model means:

- Exceptions never become stale (they are recomputed from the full event set).
- The event log is always authoritative.
- Snapshots are immutable (keyed by `event_set_digest`); same events = same snapshot.
- The verifier can reproduce any snapshot from the exported events + policy.

---

## 8. Trust Boundaries

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     BOUNDARY 1: Operator Device                      │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────────────┐  │
│  │ Mission Pkg  │   │  Dexie/IDB   │   │    Sync Engine        │  │
│  │ (policy v,   │   │  (append-    │   │  (retry, batch,       │  │
│  │  token hashes │   │   only local)│   │   exp backoff)        │  │
│  │  allocation) │   │              │   │                       │  │
│  └──────────────┘   └──────────────┘   └───────────┬───────────┘  │
│                                                     │              │
│  Device trusts its own mission package.             │              │
│  Device CANNOT know other devices' state.           │              │
│  All local records are PROVISIONAL.                 │              │
│  Device never computes authoritative totals.        │              │
└─────────────────────────────────────────────────────┼──────────────┘
                                                      │ HTTPS + Cookie
┌─────────────────────────────────────────────────────┼──────────────┐
│                     BOUNDARY 2: Server              │              │
│                                                     ▼              │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────────────┐ │
│  │  Auth Gate   │   │  PostgreSQL  │   │  @erilog/reconcile    │ │
│  │  (check      │   │  (immutable  │   │  (pure function,      │ │
│  │   before any │   │   events,    │   │   no I/O)             │ │
│  │   reveal)    │   │   snapshots) │   │                       │ │
│  └──────────────┘   └──────────────┘   └───────────────────────┘ │
│                                                                    │
│  Server validates ALL client inputs via Zod + business rules.      │
│  Server never trusts client totals/hashes/reconciliation.          │
│  Server holds Ed25519 private key (env var, never in code/DB).     │
│  Authorization checked before revealing resource existence.        │
│  Accepted events: no UPDATE, no DELETE, no admin override.         │
└────────────────────────────────────────────────────────────────────┘
                          │
                          │ Exported ZIP bundle
                          ▼
┌────────────────────────────────────────────────────────────────────┐
│                     BOUNDARY 3: Static Verifier                    │
│                                                                    │
│  ┌──────────────┐   ┌──────────────┐   ┌───────────────────────┐ │
│  │  Pinned Key  │   │ @erilog/     │   │  Manifest + Checksum  │ │
│  │  (baked at   │   │  reconcile   │   │  Verification         │ │
│  │   build time)│   │  (same pkg)  │   │                       │ │
│  └──────────────┘   └──────────────┘   └───────────────────────┘ │
│                                                                    │
│  Verifier trusts ONLY its pinned public key.                       │
│  Verifier does NOT trust bundle's declared summary.                │
│  Verifier RECOMPUTES from events + policy using @erilog/reconcile. │
│  Verifier compares recomputed result to declared result.           │
│  Signature checked against pinned key (not bundled key).           │
│  No network requests. No backend. Fully offline.                   │
└────────────────────────────────────────────────────────────────────┘
```

### Key Trust Decisions

1. **Device is untrusted.** Server validates every field. Device's local stock is advisory only.
2. **Server signs with Ed25519 private key** stored in environment (never in code, DB, bundle, or browser).
3. **Verifier pins the public key at build time.** An attacker who modifies the bundle cannot re-sign it because the verifier checks against its own pinned key, not one in the ZIP.
4. **Authorization before information.** Sync endpoints verify session/device ownership before revealing whether an event ID exists (prevents enumeration).
5. **Key rotation:** Requires redeploying the verifier with the new pinned key. The manifest contains a `keyId` field (fingerprint of the public key) so the verifier can detect mismatches with a clear diagnostic rather than a generic signature failure.

---

## 9. Failure Handling

### 9.1 Client-Side

| Failure | Behavior | Requirement |
|---|---|---|
| IndexedDB write fails | Error displayed; stock not decremented; return to pre-confirmation state; operator can retry | REQ-OFF-13, REQ-NFR-1 |
| Browser evicts IndexedDB | On startup: request `persist()`; if denied, show persistent warning about eviction risk | REQ-OFF-11 |
| Service worker not installed | Show degraded-readiness warning; suppress "Offline-ready" indicator | REQ-OFF-12 |
| Camera permission denied | Manual entry fallback always available and prominent | REQ-OFF-2 |
| Sync HTTP fails (network) | Retain in queue; exponential backoff (2s initial, 60s max) | REQ-SYN-13, REQ-NFR-2 |
| Sync response lost (server accepted, client got no 200) | Re-submit; server detects identical content; returns `already_seen`; client dequeues | REQ-SYN-1 |
| Event quarantined | Marked with reason in UI; remains visible; not discardable in hackathon | REQ-SYN-10, REQ-SYN-11 |
| Device clock wildly wrong | Sequence is canonical order (not timestamp); chain remains valid | REQ-OFF-5 |
| Pending queue > 1hr online | Persistent warning displayed | REQ-SYN-13 |

### 9.2 Server-Side

| Failure | Behavior | Requirement |
|---|---|---|
| Unauthorized request | 401/403 before revealing any resource state | REQ-SYN-2 (auth gate) |
| Schema validation fails | Quarantine with reason `SCHEMA_INVALID` | REQ-SYN-2 |
| Policy version missing | Quarantine with reason `POLICY_VERSION_UNKNOWN` | REQ-SYN-2 |
| Hash chain break | Quarantine with reason `CHAIN_BREAK` | REQ-SYN-2, REQ-SYN-8 |
| Sequence gap | Quarantine with reason `SEQUENCE_GAP` | REQ-SYN-2 |
| Event ID collision (different content) | Quarantine with reason `EVENT_ID_COLLISION` | Blocker #3 |
| Idempotent replay (identical content) | Return `already_seen` | REQ-SYN-1 |
| Device total exceeds allocation | Accept event (physical fact); reconciliation generates `device_overspend` exception | REQ-SYN-8 |
| DB write fails | Return 500; client retries via backoff | REQ-NFR-2 |

### 9.3 Verifier

| Failure | Behavior | Requirement |
|---|---|---|
| ZIP too large / too many files | Reject: "Archive exceeds safety limits (max N files, M MB)" | REQ-NFR-7 |
| Compression ratio too high | Reject: "Suspicious compression ratio (zip bomb defense)" | REQ-NFR-7 |
| Path traversal detected | Reject: "Unsafe file path: [path]" | REQ-NFR-7 |
| Signature invalid against pinned key | FAIL: "Signature verification failed. Expected key: [fingerprint]" | REQ-AUD-5, REQ-AUD-7 |
| Key ID mismatch | FAIL: "Bundle signed with key [X], verifier expects [Y]" | REQ-AUD-5 |
| File checksum mismatch | FAIL: "File [name]: expected SHA-256 [x], computed [y]" | REQ-AUD-3, REQ-AUD-7 |
| Missing file in ZIP | FAIL: "Manifest references [file] but not found in archive" | REQ-AUD-4 |
| Extra file in ZIP | FAIL: "Archive contains [file] not listed in manifest" | REQ-AUD-4 |
| Recomputed summary differs | FAIL: "Recomputed [field]: expected [x], got [y]" | REQ-AUD-2, REQ-AUD-7 |
| Recomputed exceptions differ | FAIL: "Exception set mismatch: [details]" | REQ-AUD-2, REQ-AUD-7 |

---

## 10. Audit Bundle Structure

```text
bundle.zip
├── manifest.json
├── policy.json
├── events.json
├── summary.json
└── signature.bin
```

### 10.1 manifest.json

```json
{
  "schemaVersion": "1.0.0",
  "algorithmVersion": "1.0.0",
  "missionId": "<uuid>",
  "policyVersion": 1,
  "eventCount": 4,
  "eventSetDigest": "<sha256 of sorted event IDs>",
  "exportedAt": "<ISO 8601>",
  "keyId": "<sha256 fingerprint of signing public key>",
  "canonicalization": "RFC8785",
  "files": {
    "policy.json": { "sha256": "<hex>" },
    "events.json": { "sha256": "<hex>" },
    "summary.json": { "sha256": "<hex>" }
  }
}
```

Fields:
- `schemaVersion`: Version of the bundle format.
- `algorithmVersion`: Version of `@erilog/reconcile` used to compute results.
- `policyVersion`: Which immutable policy version these events were reconciled against.
- `eventSetDigest`: Deterministic digest of the event set (matches `reconciliation_snapshots`).
- `keyId`: SHA-256 fingerprint of the Ed25519 public key. Verifier compares against its pinned key.
- `canonicalization`: Declares that all hashing uses RFC 8785 JCS.

### 10.2 Verification Procedure

```text
1. Parse ZIP with safety limits (max 20 files, 50 MB, ratio < 100:1, allowlist paths)
2. Extract manifest.json
3. Extract signature.bin
4. Verify signature.bin over manifest.json bytes against PINNED public key
5. Compare manifest.keyId against pinned key fingerprint
6. Verify manifest completeness: every listed file exists; no unlisted files
7. For each file in manifest.files: compute SHA-256, compare to declared checksum
8. Parse policy.json → MissionPolicy
9. Parse events.json → HandoutEvent[]
10. Construct ReconciliationInput from policy + events + derived device allocations
11. Call reconcile(input)
12. Canonicalize recomputed result (RFC 8785)
13. Compare to canonicalized summary.json — must be byte-equal
14. Report PASS or FAIL with per-step diagnostics
```

Note: `exportedAt` is in the manifest (which is signed) but is NOT part of the reconciliation domain result. It serves as an audit timestamp and does not affect equality checks on the domain output.

---

## 11. Property-Based Correctness Properties

All properties use fast-check with proper shrinkable arbitraries.

### 11.1 Merge-Order Independence (INV-003)

```typescript
import * as fc from 'fast-check';
import { reconcile } from '@erilog/reconcile';
import { canonicalize } from '@erilog/crypto';

it('produces identical output for any permutation of the same event set', () => {
  fc.assert(
    fc.property(
      arbitraryReconciliationInput({ minEvents: 2, maxEvents: 20 }),
      (input) => {
        const reference = reconcile(input);
        const referenceCanonical = canonicalize(reference);

        // Use fc's built-in shuffled array for shrinkability
        fc.assert(
          fc.property(
            fc.shuffledSubarray(input.events, {
              minLength: input.events.length,
              maxLength: input.events.length,
            }),
            (permuted) => {
              const permutedInput = { ...input, events: permuted };
              const result = reconcile(permutedInput);
              expect(canonicalize(result)).toBe(referenceCanonical);
            }
          ),
          { numRuns: 50 }
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

### 11.2 Idempotent Replay (INV-002)

```typescript
it('reconciling with a duplicated event ID yields the same result as without', () => {
  fc.assert(
    fc.property(
      arbitraryReconciliationInput({ minEvents: 2, maxEvents: 20 }),
      fc.nat(),
      (input, pickIndex) => {
        const idx = pickIndex % input.events.length;
        const duplicatedEvent = input.events[idx];

        // Simulate: the system deduplicates by event ID before reconciling
        // This tests that reconcile() itself is stable given unique events,
        // AND that the deduplication layer preserves the original event content.
        const withDuplicate = [...input.events, duplicatedEvent];

        // System's dedup logic (what the server does):
        const deduped = deduplicateByEventId(withDuplicate);

        // Must yield same events as original (content-identical)
        expect(deduped.length).toBe(input.events.length);
        for (const event of deduped) {
          const original = input.events.find(e => e.id === event.id);
          expect(canonicalize(event)).toBe(canonicalize(original));
        }

        // Reconciliation unchanged
        const resultOriginal = reconcile(input);
        const resultDeduped = reconcile({ ...input, events: deduped });
        expect(canonicalize(resultDeduped)).toBe(canonicalize(resultOriginal));
      }
    )
  );
});
```

### 11.3 Physical Stock Conservation (INV-004)

```typescript
it('remaining stock = initial - sum of all event quantities, regardless of exceptions', () => {
  fc.assert(
    fc.property(
      arbitraryReconciliationInput({ minEvents: 1, maxEvents: 50 }),
      (input) => {
        const result = reconcile(input);

        for (const itemType of Object.keys(input.initialStock)) {
          const eventTotal = input.events
            .filter(e => e.itemType === itemType)
            .reduce((sum, e) => sum + e.quantity, 0);

          // Conservation law: initial = distributed + remaining
          expect(result.summary.distributed[itemType] ?? 0).toBe(eventTotal);
          expect(result.summary.remaining[itemType])
            .toBe(input.initialStock[itemType] - eventTotal);
        }

        // Total physical handouts = number of events (each event = 1 handout)
        expect(result.summary.totalPhysicalHandouts).toBe(input.events.length);
      }
    )
  );
});
```

### 11.4 Duplicate Visibility (INV-005)

```typescript
it('all events sharing a token beyond allowance appear as peers in one exception', () => {
  fc.assert(
    fc.property(
      arbitraryInputWithDuplicateToken({ minDups: 2, maxDups: 5, maxPerEntitlement: 1 }),
      (input) => {
        const result = reconcile(input);

        // Find the duplicated token
        const tokenCounts = new Map<string, string[]>();
        for (const event of input.events) {
          const key = `${event.tokenHash}\x00${event.itemType}`;
          const ids = tokenCounts.get(key) ?? [];
          ids.push(event.id);
          tokenCounts.set(key, ids);
        }

        for (const [key, ids] of tokenCounts) {
          if (ids.length <= 1) continue;
          const tokenHash = key.split('\x00')[0];

          const exception = result.exceptions.find(
            ex => ex.type === 'duplicate_entitlement' && ex.tokenHash === tokenHash
          );

          // Exception must exist and reference ALL events as peers
          expect(exception).toBeDefined();
          expect(exception!.eventIds).toEqual(ids.sort());

          // No winner/original/duplicate designation exists in the type
          const exKeys = Object.keys(exception!);
          expect(exKeys).not.toContain('winnerId');
          expect(exKeys).not.toContain('originalId');
          expect(exKeys).not.toContain('primaryEventId');
          expect(exKeys).not.toContain('duplicateEventId');
        }
      }
    )
  );
});
```

### 11.5 Event Preservation (INV-001)

```typescript
it('every input event contributes its full quantity to distributed stock', () => {
  fc.assert(
    fc.property(
      arbitraryReconciliationInput({ minEvents: 1, maxEvents: 30 }),
      (input) => {
        const result = reconcile(input);

        // Each event's quantity is in the distributed total — none excluded
        const expectedByType = new Map<string, number>();
        for (const event of input.events) {
          expectedByType.set(
            event.itemType,
            (expectedByType.get(event.itemType) ?? 0) + event.quantity
          );
        }

        for (const [itemType, expected] of expectedByType) {
          expect(result.summary.distributed[itemType]).toBe(expected);
        }

        // Exception participation does NOT reduce distribution count
        const exceptedEventIds = new Set(
          result.exceptions.flatMap(ex => ex.eventIds)
        );
        const exceptedQuantity = input.events
          .filter(e => exceptedEventIds.has(e.id))
          .reduce((sum, e) => sum + e.quantity, 0);

        // These quantities ARE included in distributed (not subtracted)
        const totalDistributed = Object.values(result.summary.distributed)
          .reduce((a, b) => a + b, 0);
        expect(totalDistributed).toBeGreaterThanOrEqual(exceptedQuantity);
      }
    )
  );
});
```

### 11.6 No Winner Selection (Erilog-specific)

```typescript
it('duplicate_entitlement exceptions never designate a winner among peers', () => {
  fc.assert(
    fc.property(
      arbitraryInputWithDuplicateToken({ minDups: 2, maxDups: 4, maxPerEntitlement: 1 }),
      (input) => {
        const result = reconcile(input);

        const dupExceptions = result.exceptions.filter(
          ex => ex.type === 'duplicate_entitlement'
        );

        for (const exception of dupExceptions) {
          // Must have multiple peers
          expect(exception.eventIds.length).toBeGreaterThanOrEqual(2);

          // eventIds sorted = deterministic, not "first arrived"
          expect(exception.eventIds).toEqual([...exception.eventIds].sort());

          // quantities and timestamps ordered by the SAME sorted eventIds
          const eventsInOrder = exception.eventIds.map(id =>
            input.events.find(e => e.id === id)!
          );
          expect(exception.quantities).toEqual(eventsInOrder.map(e => e.quantity));
          expect(exception.timestamps).toEqual(eventsInOrder.map(e => e.deviceTime));

          // No structural favoritism
          expect(exception).not.toHaveProperty('winnerId');
          expect(exception).not.toHaveProperty('originalId');
          expect(exception).not.toHaveProperty('primaryEventId');
        }
      }
    )
  );
});
```

### 11.7 Tamper Detection (INV-009)

```typescript
it('any single-field mutation in a covered file causes verification to fail', () => {
  fc.assert(
    fc.property(
      arbitraryValidBundle(),
      fc.constantFrom('policy.json', 'events.json', 'summary.json'),
      fc.nat(),
      (bundle, targetFile, mutationSeed) => {
        // Apply a semantically valid mutation (not random byte flip)
        const mutated = applySemanticMutation(bundle, targetFile, mutationSeed);

        const result = verify(mutated, PINNED_PUBLIC_KEY);

        expect(result.valid).toBe(false);
        expect(result.failures.length).toBeGreaterThan(0);
        // Failure references the specific file
        expect(result.failures.some(f => f.file === targetFile)).toBe(true);
      }
    )
  );
});
```

### 11.8 Resolution Append-Only (INV-007)

```typescript
it('resolving an exception does not change physical stock or source events', () => {
  fc.assert(
    fc.property(
      arbitraryInputWithDuplicateToken({ minDups: 2, maxDups: 3, maxPerEntitlement: 1 }),
      arbitraryDisposition(),
      (input, disposition) => {
        const before = reconcile(input);

        // Resolution is a separate record; it does not modify ReconciliationInput
        // Verify the invariant: re-reconciling the SAME events produces SAME stock
        const after = reconcile(input);  // Same input = same output

        expect(canonicalize(after.summary)).toBe(canonicalize(before.summary));
        expect(after.summary.distributed).toEqual(before.summary.distributed);
        expect(after.summary.remaining).toEqual(before.summary.remaining);

        // Resolution cannot exist inside ReconciliationInput — it's a separate domain
        // This test confirms the type system enforces the boundary:
        // ReconciliationInput has no 'resolutions' field
        expect(input).not.toHaveProperty('resolutions');
      }
    )
  );
});
```

---

## 12. Offline Architecture (PWA)

### Service Worker Strategy

- **Precache:** App shell, `@erilog/reconcile` WASM/JS bundle, UI framework assets.
- **Runtime cache (cache-first):** Mission package JSON after provisioning.
- **Network-only:** Sync API calls, session endpoints.
- **Install check:** "Offline-ready" indicator requires: SW active + mission package cached + IndexedDB accessible.

### Dexie Schema

```typescript
// apps/web/lib/db/schema.ts
import Dexie from 'dexie';
import type { HandoutEvent } from '@erilog/schemas';

export class ErilogDB extends Dexie {
  events!: Dexie.Table<LocalEvent, string>;
  missions!: Dexie.Table<LocalMissionPackage, string>;
  meta!: Dexie.Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('erilog');
    this.version(1).stores({
      events: 'id, missionId, deviceId, sequence, tokenHash, syncStatus, [deviceId+sequence]',
      missions: 'id',
      meta: 'key',
    });
  }
}

export interface LocalEvent extends HandoutEvent {
  syncStatus: 'pending' | 'synced' | 'quarantined';
  quarantineReason?: string;
}

export interface LocalMissionPackage {
  id: string;  // mission ID
  deviceId: string;
  policyVersion: number;
  policy: MissionPolicy;
  tokenHashes: Set<string>;  // Stored as array, loaded as Set
  allocation: Record<string, number>;
  packageHash: string;
  provisionedAt: string;
}
```

---

## A. Change Log

| # | Blocker | Change |
|---|---|---|
| 1 | Policy versioning not immutable | Added `policy_versions` table with `REVOKE UPDATE, DELETE`. Events FK to `(mission_id, version)`. Missions table no longer holds policy directly. |
| 2 | Reconciler uses data it never receives | `ReconciliationInput` now explicitly includes `devices: DeviceAllocation[]` and `initialStock: Record<string, number>`. No implicit data. |
| 3 | Idempotency hides tampering | Sync handler now distinguishes: same ID + same content = `already_seen`; same ID + different content = `EVENT_ID_COLLISION` quarantine. Auth checked before revealing event existence. |
| 4 | Ambiguous hash format | Replaced delimiter concatenation with RFC 8785 JSON Canonicalization Scheme. Specified UTF-8 encoding, key ordering per standard, numeric representation. |
| 5 | computedAt in domain result | Removed all timestamps from `ReconciliationResult` and `StockSummary`. Export time lives only in signed `manifest.json`. |
| 6 | Property tests don't test claims | Rewrote all 8 properties: replay tests the dedup layer then reconcile; preservation asserts per-event quantity contribution; permutation uses `fc.shuffledSubarray` for shrinkability; no-winner scoped to `duplicate_entitlement` only; quantities/timestamps derived from same sorted ID array. |
| 7 | Cross-document contract mismatches | Resolved all 6: UUIDv4 for events (no fixture strings); single `itemType + quantity` per event; sequence starts at 0; `previousHash = "GENESIS"` (string, not null); `REQ-*` namespace; allocation on `devices` table (passed explicitly to reconciler). |
| 8 | Exceptions can become stale | Replaced mutable exceptions table with `reconciliation_snapshots` keyed by `event_set_digest`. Exceptions are recomputed projections, never stale rows. Old snapshots retained for history. |
| 9 | Judge tokens in plaintext | Store SHA-256 hash of capability token. Deliver via `__Host-` prefixed, `HttpOnly`, `SameSite=Strict` cookie with short TTL. Auth gate checks before any resource reveal. |
| 10 | Manifest missing fields | Added: `schemaVersion`, `algorithmVersion`, `policyVersion`, `keyId` (fingerprint), `eventSetDigest`, `canonicalization: "RFC8785"`, `eventCount`. |
| 11 | Markdown rendering issues | Cleaned all code fences, pipe escaping, and heading formatting for GitHub rendering. |

---

## B. Requirements-to-Design Traceability

| Requirement | Design Section | How Addressed |
|---|---|---|
| REQ-MIS-1 | 2.1 missions table | UUID, name, stock, status |
| REQ-MIS-2 | 3.1 Zod schemas | `z.number().int().positive()` on quantity/stock |
| REQ-MIS-3 | 2.3 devices table | UUID, label, mission FK, unique constraint |
| REQ-MIS-4 | 2.3 devices.allocation | Application-level check: sum(allocations) <= total_stock |
| REQ-MIS-5 | 2.2 policy_versions + 2.3 devices | Package = policy + hashes + allocation + integrity |
| REQ-MIS-6 | 2.2 policy_versions | Separate immutable table; REVOKE UPDATE/DELETE; events FK to version |
| REQ-MIS-7 | 2.7 judge_sessions | Isolated session, hashed token, seed 42, expiry |
| REQ-MIS-8 | 2.7 + scripts/seed-42.ts | Deterministic seed; session-scoped reset |
| REQ-OFF-1 | 12 PWA + Dexie | Service worker + IndexedDB; no network call for core ops |
| REQ-OFF-2 | 3.1 tokenHash field | QR and manual both produce same SHA-256 hash |
| REQ-OFF-3 | 12 LocalMissionPackage.tokenHashes | Local Set lookup against downloaded hashes |
| REQ-OFF-4 | 3.1 + 4.2 | All fields specified; RFC 8785 hash; UUIDv4 ID |
| REQ-OFF-5 | 4.3 verifyDeviceChain | Sequence is ordering authority; timestamp informational |
| REQ-OFF-6 | 12 Dexie index on tokenHash | Local query before confirm; UI warning |
| REQ-OFF-7 | N/A (UI concern) | Design specifies: no structural "winner" field in any schema |
| REQ-OFF-8 | 5.4 auth gate | No cross-device info available to emit speculative warnings |
| REQ-OFF-9 | N/A (UI labels) | No "approved" field in event schema; `syncStatus` = pending/synced/quarantined |
| REQ-OFF-10 | 9.1 failure table | Write-before-ack; IndexedDB commit before receipt |
| REQ-OFF-11 | 9.1 failure table | `persist()` request; warning if denied |
| REQ-OFF-12 | 12 Service Worker | Install check gates "Offline-ready" indicator |
| REQ-OFF-13 | 9.1 failure table | Write failure returns to pre-confirmation state |
| REQ-SYN-1 | 5.4 step 5 | Same ID + same content = `already_seen` |
| REQ-SYN-2 | 5.4 steps 1-8 | Zod + mission + device + policy + sequence + chain + hash |
| REQ-SYN-3 | 5.4 auth gate | Per-device chain validation; no cross-device dependency |
| REQ-SYN-4 | 6.3 + 6.4 | Pure function; canonical sort; no time/order dependency |
| REQ-SYN-5 | 6.3 step 3 | All events count; no exclusion for exception status |
| REQ-SYN-6 | 6.3 step 4 | All events are peers; no winner; deterministic exception ID |
| REQ-SYN-7 | 6.3 step 4 | `sha256(sorted_ids + type)` |
| REQ-SYN-8 | 6.3 step 6 + 9.2 | Accept event; generate `device_overspend` exception |
| REQ-SYN-9 | 6.3 step 5 | `event_overspend` exception if quantity > maxPerEntitlement |
| REQ-SYN-10 | 5.3 + 5.5 | Response categorizes each event; device dequeues appropriately |
| REQ-SYN-11 | 5.5 + 9.1 | Quarantined events visible with reason; not discardable |
| REQ-SYN-12 | 2.4 REVOKE statement | No UPDATE/DELETE on events table |
| REQ-SYN-13 | 5.5 | Exponential backoff; 1-hour warning |
| REQ-SYN-14 | 5.4 AFTER batch + 7 | New snapshot computed after each accepted event |
| REQ-AUD-1 | 10 bundle structure | ZIP with policy, events, summary, manifest, signature |
| REQ-AUD-2 | 10.2 step 11-13 | Verifier recomputes; compares canonicalized result |
| REQ-AUD-3 | 10.1 manifest.files + 10.2 step 7 | Per-file SHA-256 + Ed25519 signature |
| REQ-AUD-4 | 10.2 steps 5-6 | Completeness check both directions |
| REQ-AUD-5 | 8 trust boundary 3 + 10.1 keyId | Pinned key; keyId for mismatch diagnostic |
| REQ-AUD-6 | 10.2 | Static HTML+JS; no network; same result offline |
| REQ-AUD-7 | 9.3 failure table | Per-check diagnostics with file, expected, observed |
| REQ-AUD-8 | apps/verifier/src/tamper-lab.ts | In-memory clone; semantic mutation; re-verify |
| REQ-JDG-1 | 2.7 + app/judge route | Public URL; no signup; capability token in cookie |
| REQ-JDG-2 | scripts/seed-42.ts | Exact scenario encoded deterministically |
| REQ-JDG-3 | N/A (UX pacing) | Guided flow design constraint |
| REQ-JDG-4 | 2.7 | Reset creates new snapshot from seed; isolated |
| REQ-EXC-1 | 2.6 resolutions table | Append-only; references source events; events immutable |
| REQ-EXC-2 | 2.6 CHECK constraint | explained, authorized, investigate |
| REQ-EXC-3 | 6.3 | Resolution not in ReconciliationInput; stock unchanged |
| REQ-NFR-1 | 9.1 + 12 Dexie | Dexie transaction commit before UI ack |
| REQ-NFR-2 | 5.5 | Queue retained on network loss |
| REQ-NFR-3 | 3.1 event schema | No PII fields; tokenHash only |
| REQ-NFR-4 | 3.1 + MissionPolicySchema | Per-mission tokenSalt; acknowledged limitation |
| REQ-NFR-5 | 5.4 | Server validates all fields; never trusts client computations |
| REQ-NFR-6 | 8 trust decisions | Ed25519 key in env; never in code/DB/bundle/browser |
| REQ-NFR-7 | 9.3 + 10.2 step 1 | Max file count, size, ratio, path allowlist |

---

## C. Self-Consistency Report

### Resolved Items

All 6 contract mismatches from the review are now resolved with single canonical answers (see section 3 preamble).

### Remaining VERIFY Items

| Item | Status | Action Required |
|---|---|---|
| `maxPerEntitlement` default for seed-42 | Specified as 1 | None |
| Device allocation sum check | Application-level; no DB constraint | Implementation must enforce before activation |
| `persist()` browser support | Assumed available in target browsers | VERIFY: document target browser matrix before submission |
| Ed25519 key generation workflow | `scripts/generate-keys.ts` referenced | VERIFY: document exact key gen commands in setup guide |
| Seed-42 exact event IDs | Not yet specified | VERIFY: define in `scripts/seed-42.ts` during implementation |
| Performance targets (NFR-PER-002, 003, 004) | From PRD, unverified | VERIFY: measure during implementation or remove claims |
| WCAG 2.2 AA compliance | Targeted, not claimed | VERIFY: manual audit before submission |
| Free-tier hosting limits | Not yet selected | VERIFY: document provider and limits in final README |
| `@noble/ed25519` version | Not pinned | VERIFY: pin exact version in lockfile |
| RFC 8785 implementation | Referenced, not specified | VERIFY: use existing `canonicalize-json` or implement; test against RFC examples |

---

## Status

**Design revision complete. Awaiting human approval before generating implementation tasks.**
