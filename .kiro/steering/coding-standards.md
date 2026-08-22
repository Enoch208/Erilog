---
inclusion: auto
---

# Erilog Coding Standards

## Language and Type Safety

- TypeScript strict mode everywhere. No `any` type.
- All public APIs validated with Zod at boundaries.
- All domain types derived from Zod schemas via `z.infer<>`.
- No runtime type assertions (`as`) except in test fixtures with comment justification.

## Architecture

- Domain logic (reconcile, crypto) is framework-independent. No React, no Next.js, no Node-specific APIs beyond Web Crypto.
- Append-only data patterns. No mutable state representations for events or policy versions.
- Pure functions preferred. Side effects isolated to infrastructure boundary (DB, network, storage).
- RFC 8785 (JCS) for all canonical JSON serialization used in hashing or signing.

## Naming

- Files: kebab-case (`hash-chain.ts`, `policy-version.ts`).
- Types/interfaces: PascalCase (`HandoutEvent`, `ReconciliationResult`).
- Functions: camelCase (`computeEventHash`, `reconcile`).
- Constants: UPPER_SNAKE_CASE for true constants (`GENESIS`).
- Package imports use `.js` extension (ESM resolution).

## Testing

- Vitest for unit and integration tests.
- fast-check for property-based tests.
- Test files live in `tests/` directory per package (not colocated with source).
- Golden vector fixtures in `fixtures/` directory.
- Snapshot tests use canonical JSON (RFC 8785) for deterministic comparison.

## Build

- `pnpm turbo build` builds all packages in dependency order.
- `pnpm turbo test` runs all test suites.
- `pnpm turbo typecheck` verifies type safety across workspace.
- Individual package: `pnpm --filter @erilog/<name> test`.

## Security

- No secrets in source. Private keys via environment variables only.
- Entitlement tokens hashed with per-mission salt.
- Server validates all client inputs independently.
- ZIP parsing enforces safety limits (file count, size, compression ratio, path allowlist).

## Erilog-Specific Invariants

- Events are NEVER mutated or deleted after acceptance.
- Exceptions reference all contributing events as PEERS. No winner designation.
- Physical stock counts EVERY accepted handout regardless of exception status.
- Reconciliation is a PURE function of (policy + events + devices + initialStock).
- Resolution APPENDS decisions. It never modifies source events or stock counts.
