# Feature Spec: erilog-core

## Product Decision: The Honesty Model

A disconnected device cannot know what another disconnected device has recorded. The product resolves this honestly:

1. **Offline handouts are provisional physical records** — not global confirmations, not tentative approvals. They record that a physical item left the table.
2. **Every physical handout event is preserved.** No event is discarded, overwritten, marked as "the duplicate," or treated as less valid than another event.
3. **Duplicate entitlement use becomes an exception after sync.** All events referencing the same entitlement under a one-redemption policy are peers in the exception. The system does not choose a winner.
4. **Physical stock counts every unique accepted handout** — regardless of whether those handouts later participate in an exception.
5. **Exception resolution appends a decision without deleting evidence.** Resolution is a new record that references source events; it never mutates, hides, or reclassifies them.
6. **Reconciliation produces the same result regardless of sync order.** The function takes (policy + event set) and returns (summary + exceptions) deterministically.

These six statements govern every requirement below.

---

## EARS Notation Key

> - **Ubiquitous:** "The \<system\> shall \<action\>." (always holds)
> - **Event-driven:** "When \<trigger\>, the \<system\> shall \<action\>."
> - **State-driven:** "While \<state\>, the \<system\> shall \<action\>."
> - **Option:** "Where \<feature is included\>, the \<system\> shall \<action\>."
> - **Unwanted behavior:** "If \<condition\>, then the \<system\> shall \<action\>."

---

## 1. Mission Setup and Provisioning (MUST SHIP)

### REQ-MIS-1: Mission creation
When a coordinator submits a new mission form, the system shall create a mission record containing: a unique mission ID, a human-readable name, one or more item definitions each with a positive integer total stock, and an entitlement allowance per item (e.g., "1 kit per entitlement").

### REQ-MIS-2: Input validation
If a coordinator enters zero, negative, decimal (where units are indivisible), or integer-unsafe stock values, then the system shall reject the input with a field-level error message and shall not create or modify the mission.

### REQ-MIS-3: Device registration
When a coordinator registers a field device, the system shall assign a stable pseudonymous device ID and a coordinator-provided display label, and shall associate the device with exactly one mission.

### REQ-MIS-4: Stock allocation
When a coordinator allocates stock to devices, the system shall enforce that the sum of device allocations does not exceed mission total stock. The system shall display any unallocated reserve. Activation shall be blocked while allocations exceed total stock.

### REQ-MIS-5: Mission package generation
When a coordinator activates a mission, the system shall generate one versioned offline mission package per registered device containing: the mission policy (allowance rules), allowed entitlement-token hashes (salted per-mission), device stock allocation, issue timestamp, schema version identifier, and an integrity value covering the package contents.

### REQ-MIS-6: Policy immutability after activation
Once a mission is activated, the system shall treat its policy rules as immutable. If policy must change, the system shall create a new mission-policy version; events recorded under the prior version shall retain their original policy reference.

### REQ-MIS-7: Judge Mode session isolation
When Judge Mode is entered, the system shall create a fresh session seeded with deterministic data (seed 42) without requiring signup, payment, or configuration. Each judge session shall be isolated such that one session's actions cannot read or alter another session's state.

### REQ-MIS-8: Judge Mode reset
When a judge resets their session, the system shall restore the exact seed-42 starting state. The reset shall not affect other active sessions.

---

## 2. Offline Recording (MUST SHIP)

### REQ-OFF-1: Offline operability
While a provisioned device has no network connectivity, the system shall support mission display, local entitlement-token validation, event creation, event queue management, and local stock count — without waiting on any network call.

### REQ-OFF-2: Entitlement input normalization
When an operator scans a QR code or manually enters an entitlement token, the system shall normalize both paths to the same opaque token-hash lookup. Neither path shall reveal or display beneficiary personal data.

### REQ-OFF-3: Local token validation
When a normalized token is submitted, the system shall validate it against the device's downloaded mission package. If the token is unknown, malformed, associated with a different mission, or expired, the system shall block recording and display a specific rejection reason.

### REQ-OFF-4: Event creation
When an operator confirms a physical handout, the system shall create an immutable local event record containing: a globally unique event ID (UUIDv4 or deterministic derivation with collision probability < 2⁻⁶⁴), a monotonic device-local sequence number, mission ID, policy version ID, token hash, item type and quantity, device-local timestamp, the hash of the previous event on this device (or a genesis marker), and a self-hash covering all preceding fields.

### REQ-OFF-5: Sequence as canonical order
The device-local sequence number — not the device-local timestamp — shall define event ordering within a device's chain. Timestamps are informational metadata; sequencing and hash-chain integrity use the monotonic sequence.

### REQ-OFF-6: Local stock enforcement
While a device's remaining local allocation for an item is zero, the system shall disable the handout confirmation control for that item. The system shall decrement local available stock only after successful event persistence.

### REQ-OFF-7: Same-device duplicate warning
If the same entitlement token has already been recorded on this device in the current mission, then the system shall display a warning before confirmation. The operator must explicitly acknowledge the warning to proceed. If recorded despite the warning, both events shall be preserved and neither shall be marked as subordinate or "the duplicate."

### REQ-OFF-8: No speculative cross-device warnings
While offline, the system shall not display warnings about potential cross-device conflicts. The device has no information about other devices' recordings. Cross-device duplicate detection occurs exclusively during server-side reconciliation.

### REQ-OFF-9: Provisional status labeling
The system shall label every offline-recorded event as "Recorded on this device — pending sync." The system shall never use language implying global approval, global confirmation, or entitlement redemption for events that have not completed server reconciliation. No event shall ever be labeled "approved" — even after sync, a handout is a physical fact, not an approval.

### REQ-OFF-10: Persistence durability
When a handout event is confirmed, the system shall commit it to durable browser storage before displaying the success receipt. Queued events shall survive page reload, browser restart, and return from offline without loss.

### REQ-OFF-11: Storage persistence request
On startup, while unsynced events exist, the system shall request persistent storage (`navigator.storage.persist()`). If persistence is denied, the system shall display a warning that unsynced events are at risk of browser eviction. The system shall not claim durability guarantees it cannot enforce.

### REQ-OFF-12: Offline readiness indication
While the device holds a valid provisioned mission package and all required assets are cached, the system shall display an "Offline-ready" indicator. While required assets are missing or the service worker is not installed, the system shall display a degraded-readiness warning.

### REQ-OFF-13: Write failure recovery
If event persistence to local storage fails, the system shall display an error, shall not decrement local stock, and shall return to the pre-confirmation state. The operator may retry the same handout without re-scanning.

---

## 3. Sync and Reconciliation (MUST SHIP)

### REQ-SYN-1: Idempotent event upload
When a device submits an event whose ID already exists in the server's accepted log, the system shall acknowledge the event as "already-seen" without counting it a second time, without mutating the existing record, and without returning an error to the device. Idempotency is keyed on the event ID, not on a request or batch identifier.

### REQ-SYN-2: Server-side event validation
When the server receives a synced event, the system shall validate: schema conformance, mission membership, device authorization, policy version validity, sequence continuity relative to that device's chain, and hash-chain integrity. Invalid events shall be quarantined with machine-readable reason codes. Valid events shall never be silently discarded.

### REQ-SYN-3: Independent device validation
Device chain validation shall be independent per device. A device's event validity depends only on its own chain integrity and the mission policy at its declared policy version — never on the arrival time, content, or existence of events from other devices.

### REQ-SYN-4: Deterministic reconciliation
The system shall produce byte-equivalent normalized summaries and exception sets for any permutation of the same valid event set. Reconciliation shall be a pure function of (mission policy + set of accepted events) with no dependency on: ingestion order, wall-clock time of sync, database row ordering, or when reconciliation was last computed. The same inputs at any time shall yield the same outputs.

### REQ-SYN-5: All physical handouts count toward stock
The system shall compute remaining stock as: initial mission stock minus the sum of quantities from every unique accepted physical-handout event. An event's participation in a duplicate-entitlement exception shall not exclude its quantity from the stock count. Physical stock reflects what physically left the table, not what was "legitimately" redeemed.

### REQ-SYN-6: Duplicate-entitlement exception generation — no winner
When two or more accepted physical-handout events reference the same entitlement token under a policy that allows at most N redemptions, and the event count exceeds N, the system shall generate a persistent duplicate-exception record. The exception shall reference all contributing events as equal peers — the system shall not designate any event as "the original" or "the duplicate." The exception shall contain: the token hash (or safe label), all linked event IDs, originating device IDs, quantities, timestamps, and an initial status of "unresolved."

### REQ-SYN-7: Deterministic exception identity
Exception IDs shall be derived deterministically from the sorted set of contributing event IDs (e.g., hash of sorted member event IDs). Exception identity shall not depend on database auto-increment, insertion order, or wall-clock time.

### REQ-SYN-8: Overspend and chain-fork exceptions
If the server observes that a device's total synced quantity exceeds its allocation, or that the device's hash chain has a fork (two events claiming the same previous-hash), the system shall generate a separate exception record with violation type, evidence references, and affected event IDs. The physical events shall remain in the accepted log and shall still count toward stock.

### REQ-SYN-9: Per-event quantity violation
If a single event's quantity exceeds the per-entitlement allowance defined in the mission policy, the system shall generate an overspend exception for that event at sync time. This is independent of cross-device duplication.

### REQ-SYN-10: Sync response semantics
When the server responds to a sync request, the response shall categorize each submitted event as one of: "accepted" (new, valid), "already-seen" (idempotent duplicate), or "quarantined" (invalid, with reason). The device shall remove from its pending queue only events categorized as "accepted" or "already-seen." Events categorized as "quarantined" shall remain visible to the operator with the server-provided reason.

### REQ-SYN-11: Quarantined event handling
Quarantined events shall remain visible on the device with their reason codes. The operator cannot discard them in the hackathon release. Quarantined events do not count toward stock or reconciliation (they were never accepted).

### REQ-SYN-12: Server event immutability
The server shall not expose any API, UI, or administrative operation that deletes or mutates an accepted event. Once accepted, an event is permanent. If a data-correction need arises, it shall be handled via a correction-event type (roadmap).

### REQ-SYN-13: Retry policy
While unsynced events exist and network connectivity is available, the device shall retry sync using exponential backoff (initial interval 2 seconds, maximum interval 60 seconds). If events remain unsynced for more than 1 hour of cumulative online time, the system shall display a persistent warning to the operator.

### REQ-SYN-14: Reconciliation recomputation
When the set of accepted events for a mission changes (new event accepted), the system shall recompute the full reconciliation result. The result shall be identical regardless of how many times or at what points recomputation occurs — it depends only on the current accepted event set plus policy.

---

## 4. Audit and Verification (MUST SHIP)

### REQ-AUD-1: Bundle export
When a coordinator requests an audit export, the system shall produce a ZIP archive containing: mission policy (versioned), all accepted events, all exception records (with deterministic IDs), a computed summary, a file manifest with per-file checksums, and a digital signature covering the manifest. The bundle shall contain no secrets, private keys, or beneficiary PII.

### REQ-AUD-2: Reproducible totals
The exported summary and exception set shall be independently reproducible by applying the exported policy rules to the exported event set using the same deterministic reconciliation algorithm. The verifier shall recompute totals and exceptions from events+policy rather than trusting declared summary values.

### REQ-AUD-3: Integrity protection
The system shall protect bundle integrity with: (a) a per-file SHA-256 checksum for every content file listed in the manifest, and (b) a digital signature over the manifest. Any modification to a covered byte shall cause at least one integrity check to fail during verification.

### REQ-AUD-4: Manifest completeness
If the ZIP contains files not listed in the manifest, or the manifest references files absent from the ZIP, verification shall fail with a diagnostic identifying the discrepancy (unexpected file or missing file).

### REQ-AUD-5: Signature trust model
The bundle shall include the public key (or key identifier) used to verify the signature. The static verifier shall validate the signature against this key. The verifier UI shall clearly state: "Signature valid against the bundled key" — distinguishing cryptographic self-consistency from trust in the key's provenance. The verifier does not perform key-provenance verification; bundle authenticity beyond cryptographic self-consistency is a roadmap concern.

### REQ-AUD-6: Static verifier independence
The verifier shall operate as a static page (HTML + JS) with no backend dependency. With browser network disabled, the verifier shall accept a bundle file and return the same verification result as when online.

### REQ-AUD-7: Diagnostic failure reporting
If verification fails, the system shall report: the specific check that failed (checksum, signature, manifest completeness, recomputation mismatch), the affected file or event ID, the expected value, and the observed value (where safe to disclose). The verifier shall never report only "invalid" without diagnostics.

### REQ-AUD-8: Tamper Lab
The verifier shall include a Tamper Lab mode that: clones the bundle in browser memory, applies a specified semantic mutation (e.g., change a quantity from 1 to 2), and re-runs verification on the mutated copy. The original file shall never be overwritten. The Tamper Lab shall not "fix" the tampered bundle — it demonstrates detection only.

---

## 5. Judge Experience (MUST SHIP)

### REQ-JDG-1: Zero-friction entry
The system shall provide a public URL that reaches Judge Mode in one navigation action, with no signup, payment, API key, or local configuration required.

### REQ-JDG-2: Deterministic seed scenario
Judge Mode shall use seed 42, producing exactly:
- 2 devices (Alpha, Bravo), each allocated 50 kits from 100 total stock.
- 4 physical handout events across 3 unique entitlement tokens.
- 1 duplicate-entitlement exception (token HH-042) linking 2 events from different devices as equal peers.
- Physical stock summary: 4 units distributed, 96 remaining.
- The summary shall separately display: total physical units distributed (4), unique entitlement tokens served (3), and remaining stock (96) — making clear these are independent counts.

### REQ-JDG-3: Time-to-conflict target
The guided flow from Judge Mode entry to visible duplicate exception shall be completable in ≤ 90 seconds by a first-time user following on-screen guidance.

### REQ-JDG-4: Repeatable reset
Resetting Judge Mode shall return to the exact seed-42 starting state without requiring page reload or re-navigation. Reset shall be deterministic — repeated resets produce identical state.

---

## 6. Exception Handling (SHOULD SHIP / P1)

### REQ-EXC-1: Exception resolution as append
Where exception resolution is included, when a coordinator resolves an exception, the system shall append a resolution record containing: actor identifier, timestamp, reason text, disposition category, and references to all source event IDs. The source events shall remain unmodified, un-reclassified, and exportable. No source event shall be marked as "the winner" or "the duplicate" by the resolution.

### REQ-EXC-2: Resolution dispositions
Where exception resolution is included, the system shall support at minimum: "explained" (legitimate operational reason for duplicate), "authorized" (approved override by authority), and "investigate" (requires follow-up outside the system).

### REQ-EXC-3: Resolution does not alter stock
Where exception resolution is included, resolving an exception shall not change the physical stock count. Physical stock reflects what physically left the table. Resolution records context and decisions — it does not undo physics.

---

## 7. Non-Functional Requirements (MUST SHIP)

### REQ-NFR-1: Durable write-before-ack
The system shall not display a success receipt for a handout until the event is durably committed to IndexedDB (or equivalent persistent storage). A write failure shall display an error, shall not decrement local stock, and shall return to pre-confirmation state.

### REQ-NFR-2: Sync interruption safety
If network connectivity is lost during sync, all events not yet acknowledged by the server shall remain in the device's pending queue for automatic retry.

### REQ-NFR-3: No PII in schema
The event schema shall have no field for beneficiary name, biometric, phone number, or precise home location. Entitlement references shall be opaque salted token hashes only.

### REQ-NFR-4: Token hash privacy acknowledgment
Entitlement tokens shall be hashed with a per-mission salt stored in the mission policy. For the hackathon release, the salt is included in the offline package (necessary for local validation). The requirements acknowledge that token privacy against a party holding the mission package is not a hackathon goal. Production-grade token privacy is a roadmap concern.

### REQ-NFR-5: Server-side input validation
The server shall validate every client-submitted field independently. The server shall never trust client-computed totals, stock counts, checksums, or reconciliation results.

### REQ-NFR-6: Secret exclusion
No private signing keys, API secrets, or credentials shall be present in: the client bundle, exported audit archives, browser storage, or the git repository (including history).

### REQ-NFR-7: Archive parsing safety
When parsing an uploaded ZIP (verifier or import), the system shall enforce: a maximum file count, a maximum total uncompressed size, a compression-ratio limit (zip bomb defense), and a path-allowlist (no path traversal).

---

## Critical Analysis

### Analysis 1: Offline Operation vs. Global Duplicate Prevention

**Resolved by design.** The product decision explicitly states that cross-device conflict prevention is impossible while disconnected. The requirements now encode this through:

- REQ-OFF-8 (no speculative cross-device warnings)
- REQ-OFF-9 (provisional language only — "recorded," never "approved")
- REQ-SYN-6 (exception generated after sync, no winner chosen)

**Remaining tension:** An operator may psychologically interpret "Recorded on this device — pending sync" as "everything will be fine once I sync." The UI must not reinforce this. The language is deliberately neutral about outcome — it says what happened (recorded locally), not what will happen (will be accepted / will conflict). No additional requirement needed; this is a UX implementation concern within REQ-OFF-9.

### Analysis 2: Physical Handouts vs. Entitlement Counts

**Resolved explicitly.** The confusion risk was that "3 unique entitlements" might imply 3 stock units consumed. The requirements now:

- REQ-SYN-5: States that physical stock counts every handout, regardless of exception status.
- REQ-JDG-2: Mandates the summary separately displays physical units distributed (4), unique tokens served (3), and remaining stock (96).
- REQ-SYN-9: Handles single-event quantity exceeding allowance as a distinct overspend exception.
- REQ-EXC-3: Resolution does not alter stock — physics is not reversible by a coordinator decision.

**No remaining ambiguity.** Four handouts = 4 units gone from stock, period.

### Analysis 3: Sync-Order-Dependent Behavior

**Resolved.** The requirements now eliminate all sync-order-dependence vectors:

- REQ-SYN-4: Pure function of (policy + event set), explicitly independent of ingestion order, wall-clock time, DB ordering, and recomputation timing.
- REQ-SYN-7: Exception IDs derived from sorted contributing event IDs — deterministic and order-independent.
- REQ-SYN-3: Device validation is independent per device — no cross-device ordering dependency.
- REQ-SYN-6: All events in a duplicate exception are "equal peers" — no "first arrived = original" semantics.

**Property test implication:** A randomized permutation test over all orderings of the seed-42 event set must produce byte-equivalent output. This is the strongest form of the guarantee.

### Analysis 4: Event Loss or Last-Write-Wins

**Resolved.** The append-only model is now explicit at every layer:

- REQ-OFF-10 + REQ-OFF-11: Durable local storage with persistence request and honest warning if denied.
- REQ-OFF-13: Write failure returns to pre-confirmation state (no phantom events).
- REQ-SYN-1: Idempotent on event ID (not request ID) — handles response-lost scenarios.
- REQ-SYN-12: Server events are immutable — no admin deletion.
- REQ-SYN-6: No winner = no last-write-wins possible. Both events persist as peers.

**Remaining honest limitation:** If the browser evicts IndexedDB before sync and the operator doesn't notice, those events are gone. REQ-OFF-11 addresses this with a warning but cannot prevent it. The system is honest about what it can and cannot guarantee.

### Analysis 5: Audit and Signature Trust

**Resolved with honesty.** The circular-trust problem (bundled key can be swapped by an attacker) is acknowledged explicitly:

- REQ-AUD-5: Verifier says "Signature valid against the bundled key" — not "signed by authority."
- REQ-AUD-4: Manifest completeness check catches added/removed files.
- REQ-AUD-2: Verifier recomputes rather than trusting summary — so even a self-consistent fraudulent bundle must obey the reconciliation algorithm or fail recomputation.

**Trust chain:** signature → manifest → checksums → files → recomputation. An attacker must understand and correctly re-implement reconciliation to produce a fraudulent-but-passing bundle. This is a meaningful barrier even without key provenance.

### Analysis 6: Missing Criteria — Now Addressed

| Gap | Resolution |
|---|---|
| Client retry policy | REQ-SYN-13: exponential backoff, 1-hour warning |
| Event ID collision | REQ-OFF-4: UUIDv4 or deterministic with < 2⁻⁶⁴ collision probability |
| Token hash privacy | REQ-NFR-4: per-mission salt, honest acknowledgment of hackathon limitation |
| Write failure recovery | REQ-OFF-13: return to pre-confirmation state |
| Quarantined event fate | REQ-SYN-11: visible with reason, not discardable in hackathon release |
| Server-side event deletion | REQ-SYN-12: no delete/mutate API exists |

---

## Traceability to PRD

| Requirement | PRD Source | Invariant |
|---|---|---|
| REQ-MIS-1 – REQ-MIS-8 | FR-MIS-001–007, §9.1 | — |
| REQ-OFF-1 – REQ-OFF-13 | FR-OFF-001–008, §9.2, §12.1 | INV-001, INV-006 |
| REQ-SYN-1 – REQ-SYN-14 | FR-SYN-001–007, §9.3, §11 | INV-001–006 |
| REQ-AUD-1 – REQ-AUD-8 | FR-AUD-001–006, §9.4 | INV-008, INV-009 |
| REQ-JDG-1 – REQ-JDG-4 | FR-JDG-001–002, §14.1 | — |
| REQ-EXC-1 – REQ-EXC-3 | FR-SYN-008 | INV-007 |
| REQ-NFR-1 – REQ-NFR-7 | §12.1–12.4 | INV-010 |

---

## Status

**Awaiting approval before producing design or implementation tasks.**
