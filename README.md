<div align="center">

<img src="apps/web/public/logo.png" alt="Erilog" width="220" />

<br />
<br />

<img src="apps/web/public/hero-evidence-2.png" alt="Erilog evidence and reconciliation concept" width="100%" />

<sub>Illustrative product artwork. The working interface is available locally through Judge Mode.</sub>

<br />
<br />

[![CI](https://github.com/Enoch208/Erilog/actions/workflows/ci.yml/badge.svg)](https://github.com/Enoch208/Erilog/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-154%20passing-10b981)
![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)

### Offline-first evidence infrastructure for physical aid distribution.

Erilog preserves every recorded handout, reconciles disconnected field devices deterministically, and produces a signed audit bundle whose integrity can be checked without trusting the live application.

**Core guarantee: conflicts cannot disappear.**

[Run the proof](#run-the-deterministic-proof) · [Open Judge Mode](#run-judge-mode) · [Architecture](#architecture) · [Implementation status](#implementation-status)

</div>

---

## Why Erilog exists

Relief distribution happens in the physical world, often with intermittent connectivity and multiple operators serving the same population. A conventional CRUD system can tell a clean story by overwriting state. That is exactly the failure mode Erilog avoids.

If two disconnected devices record the same entitlement, both physical handouts still happened. Erilog keeps both events, counts both against stock, and surfaces a peer conflict for review. It does not silently merge records, discard the later sync, or invent an “original” event after the fact.

The result is an evidence trail designed around three properties:

1. **Offline continuity** — a loaded operator page records handouts to IndexedDB without a live connection.
2. **Deterministic reconciliation** — the same immutable event set produces the same summary and exceptions regardless of sync order.
3. **Independent evidence** — canonical hashes, Ed25519 signatures, and a portable ZIP bundle make tampering detectable outside the operational database.

## Table of contents

- [Run the deterministic proof](#run-the-deterministic-proof)
- [Run Judge Mode](#run-judge-mode)
- [Seed-42 contract](#seed-42-contract)
- [Architecture](#architecture)
- [Evidence lifecycle](#evidence-lifecycle)
- [Integrity and reconciliation model](#integrity-and-reconciliation-model)
- [Signed audit bundle](#signed-audit-bundle)
- [Engineering decisions](#engineering-decisions)
- [Trust, security, and privacy](#trust-security-and-privacy)
- [Implementation status](#implementation-status)
- [Technology and repository layout](#technology-and-repository-layout)
- [Local development](#local-development)
- [Tests and CI](#tests-and-ci)
- [Known limitations](#known-limitations)
- [Kiro development process](#kiro-development-process)
- [License](#license)

## Run the deterministic proof

The fastest way to evaluate Erilog is the headless signature demo. It uses production crypto, reconciliation, archive, and verifier modules—no mocked pass/fail output and no database required.

```bash
pnpm install --frozen-lockfile
pnpm demo:headless
```

The ten-step proof:

1. Loads the frozen seed-42 mission.
2. Records two offline events on Device Alpha.
3. Records two offline events on Device Bravo.
4. Syncs both devices through the real ingestion rules.
5. Replays a batch to prove idempotency.
6. Reconciles all four physical handouts.
7. Exposes the shared entitlement as a peer exception.
8. Writes and re-reads a real signed ZIP archive.
9. Verifies the untouched archive successfully.
10. Changes one quantity from `1` to `2` and proves verification fails on `events.json`.

Expected result:

```text
ALL 10 STEPS PASSED

Core guarantee proven: CONFLICTS CANNOT DISAPPEAR
- 4 physical handouts counted (stock: 96 remaining)
- Duplicate HH-042 exposed as peer exception
- No winner selected among conflicting events
- Signed bundle verifies; tampered bundle fails
- Same reconciliation regardless of sync order
```

The generated archive is written to `tmp/seed-42-bundle.zip`.

## Run Judge Mode

Judge Mode turns the same seed-42 contract into a guided browser workflow with coordinator and operator views.

### Prerequisites

- Node.js 20 or newer
- pnpm 10.33.0
- Docker with Compose

### Start the application

```bash
pnpm install --frozen-lockfile
docker compose up -d
pnpm db:setup
cp .env.example apps/web/.env.local
pnpm tsx scripts/generate-keys.ts
```

Copy the generated private key into `ERILOG_SIGNING_PRIVATE_KEY` in `apps/web/.env.local`, then start the web application:

```bash
pnpm --filter @erilog/web dev
```

Open [http://localhost:3000/judge](http://localhost:3000/judge).

### Browser walkthrough

1. Start the deterministic Judge session.
2. Open Device Alpha and record `HH-040`, then `HH-042`.
3. Open Device Bravo and record `HH-041`, then `HH-042`.
4. Take either loaded operator page offline before recording to exercise IndexedDB persistence.
5. Reconnect and trigger sync from each device.
6. Open the coordinator view to inspect stock, event count, and the `duplicate_entitlement` exception.
7. Export the signed audit archive.

Judge Mode is intentionally deterministic: the mission, device allocations, tokens, and expected reconciliation are fixed so reviewers can reproduce the same evidence every time.

> Judge sessions currently share the fixed demonstration mission, and reset is global/demo-only. This is an evaluation path, not a multi-tenant production control plane.

## Seed-42 contract

The repository freezes one cross-package scenario as a golden contract. Crypto vectors, reconciliation tests, the browser workflow, and the headless proof all agree on these values.

| Input | Value |
|---|---|
| Mission | Emergency Distribution Alpha |
| Initial stock | 100 emergency kits |
| Device Alpha allocation | 50 |
| Device Bravo allocation | 50 |
| Alpha handouts | `HH-040`, `HH-042` |
| Bravo handouts | `HH-041`, `HH-042` |

| Reconciled result | Value |
|---|---|
| Physical handouts | 4 |
| Remaining stock | 96 |
| Unique tokens served | 3 |
| Exceptions | 1 × `duplicate_entitlement` |
| Conflict peers | both `HH-042` events |
| Event-set digest | `0923732dccf06370ed9143a5aa0d573418296899ca01a4ac1263a6ffcb4b0481` |

The duplicate entitlement does **not** reduce physical stock usage to three. Four kits left the warehouse, so four kits are counted. The exception changes the interpretation of the evidence, not the physical history.

## Architecture

```mermaid
flowchart LR
    subgraph Field[Field devices]
        A[Operator Alpha\nNext.js UI]
        B[Operator Bravo\nNext.js UI]
        IA[(IndexedDB\nevent queue)]
        IB[(IndexedDB\nevent queue)]
        A --> IA
        B --> IB
    end

    subgraph Service[Erilog service]
        API[Authenticated sync API]
        INGEST[Schema + hash-chain\nvalidation]
        REC[Deterministic\nreconciliation]
        EXPORT[Signed bundle\nexport]
        DB[(PostgreSQL\nevents + snapshots)]
        API --> INGEST --> DB
        DB --> REC --> DB
        REC --> EXPORT
    end

    subgraph Independent[Independent verification]
        ZIP[Audit ZIP]
        VERIFY[Verifier core\narchive + checksum + signature]
        RESULT[PASS / named failures]
        ZIP --> VERIFY --> RESULT
    end

    IA -->|user-triggered sync| API
    IB -->|user-triggered sync| API
    EXPORT --> ZIP
```

### Package boundaries

| Package/application | Responsibility |
|---|---|
| `@erilog/schemas` | Runtime Zod contracts and shared TypeScript types |
| `@erilog/crypto` | RFC 8785 canonicalization, SHA-256 hashing, Ed25519 signing, golden vectors |
| `@erilog/reconcile` | Ingestion rules, idempotency, deterministic reconciliation, snapshots, archive generation |
| `@erilog/web` | Landing page, Judge Mode, Dexie offline queue, sync API, PostgreSQL persistence, export API |
| `@erilog/verifier` | Safe ZIP parsing, checksums, signature verification, recomputation, tamper lab |

The cryptographic and reconciliation kernels are independent of the web interface. The headless proof imports those production packages directly, which keeps the strongest claim testable without a browser or a running server.

## Evidence lifecycle

### 1. Record an append-only event

Each handout is represented as an event containing mission, device, monotonic sequence, token hash, item, quantity, device time, and the previous event hash. The new `eventHash` commits to the canonical form of those fields.

```text
GENESIS <- event 0 hash <- event 1 hash <- event 2 hash
```

A device can therefore queue evidence while disconnected without mutating previously recorded handouts.

### 2. Synchronize idempotently

When connectivity returns, the client submits queued events. The server validates the request, event schema, mission/device relationship, sequence and chain integrity, then persists new event IDs. Replayed event IDs return `already_seen` rather than creating a second handout.

Sync acceptance means the event is structurally valid and part of the evidence set. It does not mean the event is conflict-free.

### 3. Reconcile the complete set

Reconciliation sorts and evaluates the immutable set using stable rules. It computes physical stock, unique entitlements, and explicit exception groups. Property tests permute event order to prove that arrival order does not alter the result.

### 4. Snapshot the result

The service stores reconciliation snapshots alongside the events used to derive them. Snapshots are projections for review and export; the event log remains the source evidence.

### 5. Export and verify

The coordinator exports canonical evidence files, a checksum manifest, and an Ed25519 signature. The verifier safely parses the archive, checks every layer, and reports named failures instead of a generic invalid state.

## Integrity and reconciliation model

### Canonical event hashing

Erilog canonicalizes JSON according to RFC 8785 before hashing. Equivalent data therefore produces identical bytes across packages and runtimes.

```text
eventHash = SHA-256(RFC8785(event fields excluding eventHash))
```

Each device event includes `previousHash`, creating a per-device chain. The first event points to `GENESIS`.

### Event-set digest

A reconciliation commits to the whole accepted set, not the order in which devices connected:

```text
eventSetDigest = SHA-256(sorted event hashes)
```

The frozen seed-42 digest is asserted by golden tests and by the headless demo.

### Honest conflict semantics

For a duplicated token, Erilog creates one exception containing all peer event IDs, devices, and quantities. It deliberately has no `winnerId`, `originalId`, or `primaryEventId` field.

That choice prevents sync timing from rewriting history. Operational resolution can be layered on top, but unresolved evidence remains visible.

## Signed audit bundle

A generated ZIP contains:

```text
seed-42-bundle.zip
├── policy.json
├── events.json
├── summary.json
├── manifest.json
└── signature.bin
```

`manifest.json` records the schema version, algorithm version, mission and policy identifiers, event count, event-set digest, export time, key fingerprint, canonicalization scheme, and SHA-256 checksum for every evidence file. `signature.bin` is the Ed25519 signature of the canonical manifest.

The verifier performs layered checks:

1. Archive path, file-count, and uncompressed-size safety limits.
2. Required file presence and strict JSON parsing.
3. Manifest file checksums.
4. Ed25519 signature against the supplied public key.
5. Per-device event hash-chain integrity.
6. Event-set digest recomputation.
7. Reconciliation summary and exception recomputation.

A changed quantity fails the `file_checksum` check for `events.json`; deeper recomputation checks protect the evidence model even when an archive is reconstructed rather than edited in place.

## Engineering decisions

### Preserve physical truth before resolving policy truth

Inventory reflects every accepted physical handout. Duplicate entitlement use appears as an exception, but does not make a distributed item reappear in remaining stock.

### Make reconciliation a pure deterministic operation

The engine receives mission policy plus an event set and returns a summary, digest, and exceptions. It does not depend on wall-clock processing order or mutable global state.

### Separate ingestion from interpretation

Sync checks whether evidence is authentic enough and well-formed enough to enter the log. Reconciliation determines what the complete evidence means. This avoids rejecting a real physical event merely because it conflicts with another disconnected device.

### Use canonical bytes at cryptographic boundaries

Signatures and hashes are only stable if every runtime agrees on serialization. RFC 8785 is used instead of relying on insertion order or pretty-printed JSON.

### Keep the proof outside the UI

The headless demo exercises production modules and a real ZIP round trip. A visual workflow can regress without weakening the ability to demonstrate the core guarantee.

### Return named verification failures

“Invalid bundle” is insufficient during an audit. Verifier results identify the failed check and, where relevant, the exact file plus expected and observed values.

## Trust, security, and privacy

- **No raw entitlement code in event evidence.** Field-entered tokens are represented by SHA-256 hashes in persisted handout events.
- **Authenticated mutation APIs.** Judge sync and export operations validate demonstration session access before processing evidence.
- **Server-side revalidation.** Client-generated hashes and reconciliation views are not accepted as authoritative without server checks.
- **Ed25519 signatures.** Bundle signatures bind the canonical manifest to a specific public-key fingerprint.
- **Append-oriented database permissions.** The SQL schema revokes update/delete privileges on policies, events, resolutions, and reconciliation snapshots from the no-login `app_role`.
- **Safe archive handling.** The verifier limits paths, file counts, and expanded size before consuming ZIP content.
- **Minimal beneficiary data.** The seed contract uses synthetic entitlement IDs; the evidence model does not require names, phone numbers, or addresses.

Cryptographic evidence proves integrity relative to the signing key and recorded inputs. It does not prove that a field operator entered a physically true claim, and it cannot protect a private signing key that has been compromised.

## Implementation status

| Capability | Status | Current behavior |
|---|---|---|
| Runtime schemas and validation | Implemented | Shared Zod contracts across packages |
| Canonical event hashing | Implemented | RFC 8785 + SHA-256 golden vectors |
| Per-device hash chains | Implemented | Sequence and previous-hash validation |
| Offline event recording | Implemented | A loaded operator page writes to Dexie/IndexedDB while offline |
| Idempotent sync | Implemented | New events accepted; replays return `already_seen` |
| Deterministic reconciliation | Implemented | Stable summaries, digests, and peer exceptions |
| PostgreSQL persistence | Implemented | Events and reconciliation snapshots persisted server-side |
| Signed ZIP export | Implemented | Canonical files, checksums, manifest, Ed25519 signature |
| Verifier core and tamper lab | Implemented | Library and headless proof return detailed failures |
| Judge Mode | Implemented | Local deterministic coordinator/operator workflow |
| PWA manifest and production service worker | Partial | Static assets are cached; development unregisters the worker |
| Full offline navigation/reload | Partial | Already-loaded operator workflow works offline; full app shell is not guaranteed |
| Device allocations in exported verification context | Partial | Current verifier integration uses an oversized inferred allocation |
| Browser verifier page | Not shipped | No `/verify` interface or deployable static verifier yet |
| Automatic background sync | Not shipped | Sync is explicitly user-triggered |
| QR scanning | Not shipped | Judge Mode uses typed seed tokens |
| Exception resolution workflow | Not shipped | Exceptions are exposed but not adjudicated in the UI |
| Public hosted demo | Not shipped | No deployment configuration or supported public URL |
| Install prompt/report download UX | Not shipped | Core PWA metadata/export APIs exist without these product surfaces |

## Technology and repository layout

### Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.8, strict mode |
| Web | Next.js, React, Tailwind CSS |
| Offline storage | Dexie over IndexedDB |
| Database | PostgreSQL 15, Drizzle schema |
| Contracts | Zod |
| Cryptography | RFC 8785 canonical JSON, SHA-256, Ed25519 |
| Archive | ZIP with bounded safe-reader checks |
| Unit/integration/property tests | Vitest, fast-check |
| Browser specifications | Playwright |
| Monorepo | pnpm workspaces, Turborepo |

### Repository layout

```text
apps/
├── web/                     # Next.js application, Judge UI, APIs, offline client
└── verifier/                # Independent verifier core and tamper lab
packages/
├── schemas/                 # Runtime contracts and shared types
├── crypto/                  # Canonicalization, hashes, signatures, vectors
└── reconcile/               # Sync rules, reconciliation, bundle generation
drizzle/
└── 0001_schema.sql          # PostgreSQL schema and immutability permissions
scripts/
├── demo-headless.ts         # End-to-end deterministic proof
└── generate-keys.ts         # Local Ed25519 key generation
.kiro/specs/erilog-core/     # Requirements, design, and implementation tasks
docs/product/                # Product requirements and concept brief
```

## Local development

### Environment

Copy the browser environment template:

```bash
cp .env.example apps/web/.env.local
```

The default local database URL is:

```text
postgresql://erilog:erilog_dev@localhost:5432/erilog
```

Generate an Ed25519 private key and place it in `apps/web/.env.local`:

```bash
pnpm tsx scripts/generate-keys.ts
```

Do not commit the generated key. The key in CI is a deterministic test fixture, not a production secret.

### Database

Start PostgreSQL and apply the schema:

```bash
docker compose up -d
pnpm db:setup
```

`db:setup` is intended for an empty Erilog database. To rebuild a disposable local database from scratch, remove the Compose volume only after confirming it contains no data you need.

### Commands

```bash
pnpm --filter @erilog/web dev   # local web application
pnpm demo:headless              # deterministic 10-step proof
pnpm test                       # 154 Vitest tests
pnpm typecheck                  # workspace type checks
pnpm build                      # production builds
```

## Tests and CI

The root Vitest run currently passes **154 tests**:

| Workspace | Tests | Coverage focus |
|---|---:|---|
| `@erilog/schemas` | 20 | Event, mission, sync, bundle, and exception contracts |
| `@erilog/crypto` | 37 | Canonicalization, golden hashes, signatures, seed-42 vectors |
| `@erilog/reconcile` | 30 | Reconciliation, permutations, seed contract, PostgreSQL integration |
| `@erilog/verifier` | 13 | Valid archives, tampering, malformed and unsafe inputs |
| `@erilog/web` | 54 | Sync edge cases, API behavior, security, accessibility, performance |
| **Total** | **154** | |

Run them with:

```bash
pnpm test
```

Eight Playwright specifications also describe browser flows and launch-gate checks. They are not part of the root `pnpm test` command or the current CI workflow, so they are intentionally not included in the 154-test badge.

GitHub Actions runs on Node.js 20 with PostgreSQL 15 and executes:

```text
install → typecheck → Vitest → build → headless proof
```

## Known limitations

Erilog is a working technical demonstration, not a finished deployment:

- There is no hosted environment or deployment configuration.
- The independent verifier is implemented as a library and headless workflow, not a browser page.
- Offline support covers recording on an already-loaded operator page; arbitrary navigation and hard reloads are not fully offline.
- Synchronization is user-triggered rather than scheduled through the Background Sync API.
- Judge sessions share one fixed mission, and reset affects the global demonstration state.
- The current export/verifier bridge infers an overly large per-device allocation (`1000` emergency kits) instead of exporting the authoritative allocation context.
- QR capture, exception adjudication, install prompts, and report-download UX are not implemented.
- Key generation exists, but production key custody, rotation, revocation, and deployment hardening remain operational work.

These constraints are documented to keep evaluation focused on what the repository proves today: append-only offline evidence, order-independent reconciliation, and tamper detection.

## Kiro development process

Erilog was developed through Kiro's spec workflow. Requirements, design decisions, and implementation tasks remain in the repository for traceability:

- [Requirements](.kiro/specs/erilog-core/requirements.md)
- [Technical design](.kiro/specs/erilog-core/design.md)
- [Implementation tasks](.kiro/specs/erilog-core/tasks.md)
- [Product requirements](docs/product/PRD.md)
- [Concept brief](docs/product/CONCEPT-BRIEF.md)

The frozen seed-42 scenario acts as the thread connecting those documents to schemas, cryptographic vectors, reconciliation behavior, Judge Mode, and the executable proof.

## License

No open-source license has been granted for this repository yet. Until a license file is added, the source is available for review but should not be assumed to permit reuse, redistribution, or modification.
