# Product requirements document: Erilog

| Field | Value |
| --- | --- |
| Document status | **PROPOSED — implementation-ready draft** |
| Product | Erilog |
| Release | Hackathon demonstration release |
| Product owner | **VERIFY: entrant name** |
| Target submission | Ready, Spec, Ship Hackathon, August 2026 |
| Core guarantee | **Conflicts cannot disappear.** |
| Data policy | Synthetic, pseudonymous data only |

## 1. Executive summary

Erilog helps small relief teams record and reconcile physical distributions in places with unreliable connectivity. Field operators can record handouts offline. When devices reconnect, the system ingests every event idempotently, detects duplicate entitlement use and stock-policy breaches, and keeps the underlying physical history intact. Coordinators can export a tamper-evident audit bundle and verify it in a static browser tool without trusting the live application.

The hackathon release is intentionally narrow. It demonstrates one hard and useful guarantee rather than simulating a complete humanitarian platform.

## 2. Problem statement

### 2.1 Operational problem

Small response teams commonly face a combination of:

- intermittent or absent internet access at distribution points;
- multiple workers operating concurrently on separate devices;
- paper, chat, or spreadsheet-based tracking;
- pressure to keep queues moving;
- a need to explain stock differences later; and
- limited capacity for enterprise identity or logistics software.

### 2.2 Technical contradiction

Two common requirements conflict:

1. “A valid entitlement must be approved immediately while every device is offline.”
2. “The same entitlement must never be redeemed twice across disconnected devices.”

Without communication or a physically uncopyable token, a device cannot know what another disconnected device has accepted. Erilog resolves this honestly:

- offline records are **provisional physical events**, not global guarantees;
- device stock is bounded locally to limit exposure;
- all events are preserved after sync;
- conflicting entitlement use becomes an explicit exception; and
- exception resolution appends a decision without erasing the original events.

### 2.3 Why current lightweight tools are insufficient

Paper and spreadsheets are easy to start but weak at offline concurrency, deduplication, provenance, and repeatable audit. Generic CRUD dashboards can record “current state” but often use overwrites that lose how the state was produced. Erilog is differentiated by preserving events and making reconciliation independently reproducible.

## 3. Product vision

Give a small response team a trustworthy answer to three questions:

1. **What did each device record physically handing out?**
2. **Where do those records disagree with mission rules?**
3. **Can an independent reviewer verify the exported answer?**

## 4. Product principles

1. **Truth before tidiness.** A visible inconsistency is better than a clean but false total.
2. **Physical events are immutable.** Corrections and resolutions add records; they do not rewrite history.
3. **Offline means useful, not omniscient.** The interface states what is local, provisional, synced, or globally reconciled.
4. **No hidden personal data.** The demo uses opaque entitlement tokens and synthetic records only.
5. **Determinism is a feature.** The same mission rules and event set must produce the same reconciliation result in any ingestion order.
6. **Verification must be independent.** An exported bundle is checked outside the live app and without a network request.
7. **Explain failure.** A red verifier result names the failed check and affected record; it does not merely say “invalid.”
8. **Claims follow evidence.** Documentation and video describe only behavior that has been tested in the submitted build.

## 5. Users and jobs to be done

### 5.1 Distribution coordinator

**Context:** Plans the mission and is accountable for stock and exceptions.

**Job:** “Help me define the rules, allocate stock to field devices, see what happened after sync, and produce a defensible report.”

**Needs:** clear mission setup, device allocation, reconciliation summary, exception detail, export.

### 5.2 Field operator

**Context:** Works under time pressure on a phone with unreliable connectivity.

**Job:** “Let me validate a locally known entitlement, record the physical handout quickly, and know whether the record is safe on this device.”

**Needs:** large controls, offline clarity, scan/manual fallback, local stock count, duplicate-on-this-device warning, clear receipt.

### 5.3 Auditor or program reviewer

**Context:** Did not operate the distribution and should not have to trust the live database.

**Job:** “Let me confirm the exported records are internally consistent and have not changed since they were signed.”

**Needs:** zero-install verifier, plain-language results, reproducible totals, exact failure location.

### 5.4 Hackathon judge

**Context:** Has minutes, may not clone the repository, and evaluates many projects.

**Job:** “Show me the real value and technical guarantee immediately, then give me a reliable path to verify it.”

**Needs:** no-signup Judge Mode, deterministic scenario, short instructions, stable deployment, honest limitations, visible Kiro evidence.

## 6. Goals

### 6.1 Release goals

- Demonstrate a complete offline → conflict → reconciliation → audit workflow.
- Preserve all valid physical handout events through repeated and reordered sync.
- Make duplicate entitlement use impossible to hide through normal UI or sync behavior.
- Reconcile physical inventory from events instead of inferred entitlement status.
- Produce a bundle whose integrity and totals can be checked in a static browser page.
- Let a first-time judge reach the core conflict in no more than **90 seconds** from opening Judge Mode.
- Provide a fresh-clone setup path with no paid dependency.
- Make Kiro’s role inspectable through real specs, steering, hooks, tests, and process notes.

### 6.2 Learning goals

- Validate whether event preservation and explicit exceptions are understandable to non-specialists.
- Validate whether the phrase “recorded locally, pending global reconciliation” prevents false confidence.
- Validate whether a verifier failure explanation is useful without developer knowledge.

## 7. Non-goals

The hackathon release does **not** aim to:

- prove a person’s identity;
- prevent card sharing or physical coercion;
- detect fraud using AI;
- replace a major humanitarian registration or logistics platform;
- process money, vouchers, or payments;
- store names, biometrics, phone numbers, precise locations, or protected case data;
- guarantee Byzantine security against a compromised server or stolen signing key;
- support cross-organization deduplication;
- optimize delivery routes or forecast demand;
- provide production-grade legal or regulatory compliance; or
- ship every roadmap integration.

## 8. Release scope

### 8.1 MUST SHIP: coherent vertical slice

| Capability | User value | Completion evidence |
| --- | --- | --- |
| Isolated Judge Mode | Immediate evaluation with no signup or setup | Fresh browser creates a seeded, resettable session. |
| Mission contract | Makes distribution rules explicit | Mission shows stock, entitlement allowance, devices, and exception policy. |
| Device provisioning | Bounds offline stock | Alpha and Bravo each receive a signed package and 50 kits. |
| Offline operator view | Works through connectivity loss | Handouts are recorded with network disabled and survive reload. |
| QR and manual entry | Works with camera or keyboard | Both paths create the same validated event type. |
| Append-only event queue | Protects local history | Recorded event cannot be silently edited or deleted through the UI. |
| Idempotent sync | Safe retries | Re-uploading an event ID does not double-count it. |
| Deterministic reconciliation | Stable truth from distributed inputs | All permutations of a fixed event set yield the same result. |
| Exception workbench | Makes disagreement visible | `HH-042` shows two linked events, devices, quantities, and status. |
| Physical inventory summary | Accounts for what left the table | Seed 42 reports 4 distributed and 96 remaining. |
| Audit bundle | Portable evidence | ZIP includes rules, events, exceptions, summary, manifest, checksums, and signature. |
| Static verifier | Independent verification | Valid bundle passes offline; changed event fails with useful diagnostics. |
| Automated tests | Evidence for guarantees | Core unit, integration, property-based, and one end-to-end scenario pass. |
| Complete docs | Removes judge guesswork | README, setup, testing, Kiro process, costs, attribution, and limitations are current. |

### 8.2 SHOULD SHIP

- install prompt and offline-ready indicator;
- exception resolution as a new signed event with reason;
- downloadable sample bundles;
- high-contrast theme, skip link, keyboard scanner fallback, reduced motion;
- audit timeline and copyable exception ID;
- automated deployment smoke check;
- Docker Compose local environment.

### 8.3 ROADMAP

See [Roadmap and limitations](ROADMAP-LIMITATIONS.md). Roadmap items may be discussed as potential, never as current functionality.

## 9. Canonical user journeys

### 9.1 Coordinator creates a mission

1. Select **Create mission**.
2. Enter a mission name and add “Emergency kit” with total stock `100`.
3. Set one kit per entitlement.
4. Add devices Alpha and Bravo and allocate `50` kits to each.
5. Generate the mission and entitlement package.
6. Confirm that allocations equal total stock.
7. Open or share each device’s provisioning link.

### 9.2 Operator records a handout offline

1. Device shows **Offline-ready** before connectivity is disabled.
2. Operator scans or enters `HH-042`.
3. App confirms the token is known to the downloaded mission package.
4. Operator presses **Confirm physical handout**.
5. App decrements local available stock and saves an immutable event.
6. Receipt says **Recorded on this device — pending sync**.
7. Reloading while offline still shows the queued event.

### 9.3 Devices reconcile

1. Alpha reconnects and syncs two events.
2. Bravo reconnects and syncs two events.
3. The server accepts all four unique events.
4. Reconciliation groups the two `HH-042` events into one duplicate exception.
5. Summary counts all four physical handouts and reports 96 kits remaining.
6. Reversing sync order produces the same summary and exception ID.

### 9.4 Auditor verifies and tampers

1. Coordinator exports the audit ZIP.
2. Auditor opens the static verifier; no login or upload is required.
3. Dragging the ZIP into the page produces **AUDIT VALID**.
4. In Tamper Lab, auditor changes one recorded quantity from `1` to `2` while preserving valid JSON.
5. Verification produces **AUDIT INVALID** with checksum, event-chain, and recomputed-total details.

## 10. Functional requirements

Priority key: **P0 = MUST SHIP**, **P1 = SHOULD SHIP**, **P2 = ROADMAP**.

### 10.1 Mission and provisioning

| ID | Pri. | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| FR-MIS-001 | P0 | A coordinator can create a mission with item definitions and total stock. | Positive integer stock is accepted; zero, negative, decimal where units are indivisible, and unsafe values are rejected with field-level errors. |
| FR-MIS-002 | P0 | A mission defines an entitlement allowance per item. | The stored versioned policy is visible before activation and included in every export. |
| FR-MIS-003 | P0 | A coordinator can register at least two field devices. | Each device has a stable pseudonymous ID and display label. |
| FR-MIS-004 | P0 | A coordinator allocates stock to devices. | Activation is blocked when allocations exceed mission stock; unallocated reserve is allowed and shown. |
| FR-MIS-005 | P0 | The system creates a versioned offline mission package per device. | Package contains policy, allowed entitlement-token hashes, allocation, issue time, schema version, and integrity data. |
| FR-MIS-006 | P0 | Mission rules become immutable after activation. | A rule change creates a new mission-policy version; old events retain their original policy reference. |
| FR-MIS-007 | P0 | Judge Mode creates a fresh seeded mission without signup. | Each session is isolated and resettable; one judge cannot alter another judge’s data. |

### 10.2 Offline recording

| ID | Pri. | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| FR-OFF-001 | P0 | The operator app works after loss of network once a mission is provisioned. | Mission, local token validation, event creation, queue, and stock count work with browser network disabled. |
| FR-OFF-002 | P0 | An operator can scan a QR entitlement or use a manual fallback. | Both paths normalize to the same opaque token lookup and do not reveal personal data. |
| FR-OFF-003 | P0 | The device validates the entitlement against its downloaded package. | Unknown, malformed, wrong-mission, or expired tokens are blocked locally with a reason. |
| FR-OFF-004 | P0 | A confirmed physical handout creates an immutable local event. | Event includes stable ID, device sequence, mission and policy IDs, token hash, items, local time, previous hash, and event hash. |
| FR-OFF-005 | P0 | A device cannot record more software-authorized stock than its allocation. | The confirmation control is blocked at zero; server independently checks and flags violations. |
| FR-OFF-006 | P0 | A repeat token on the same device is warned before confirmation. | Operator must explicitly acknowledge; if recorded, both events remain and later create an exception. |
| FR-OFF-007 | P0 | The interface distinguishes local recording from global reconciliation. | Offline receipt uses “Recorded on this device — pending sync,” never “globally approved.” |
| FR-OFF-008 | P0 | Queued events survive page reload and app restart. | Browser persistence test reloads offline and finds the same event IDs and local stock. |

### 10.3 Sync and reconciliation

| ID | Pri. | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| FR-SYN-001 | P0 | A device can retry event upload safely. | An event ID already accepted is acknowledged but not counted a second time. |
| FR-SYN-002 | P0 | The server validates schema, mission, device, policy version, sequence, and hash continuity. | Invalid records are quarantined with reason codes; accepted records are never silently discarded. |
| FR-SYN-003 | P0 | Reconciliation is deterministic for a fixed valid event set. | Randomized ingestion permutations produce byte-equivalent normalized summaries and exception sets. |
| FR-SYN-004 | P0 | Every unique accepted physical handout affects inventory exactly once. | Four unique seed events reduce total stock from 100 to 96 even though two share one entitlement. |
| FR-SYN-005 | P0 | Multiple handouts against one entitlement produce a duplicate exception. | Exception contains the token hash or safe label, all linked event IDs, devices, quantities, and status. |
| FR-SYN-006 | P0 | Device overspend or chain fork produces a separate exception. | Physical event remains visible; violation type and evidence are explicit. |
| FR-SYN-007 | P0 | Sync responses explain accepted, already-seen, and quarantined records. | Device queue removes only acknowledged event IDs and retains failures for operator attention. |
| FR-SYN-008 | P1 | A coordinator can resolve an exception without deleting evidence. | Resolution adds actor, time, reason, disposition, and references; underlying events remain exportable. |

### 10.4 Audit and verification

| ID | Pri. | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| FR-AUD-001 | P0 | A coordinator can export a versioned audit bundle for a mission snapshot. | ZIP contains only documented files and no secrets or personal data. |
| FR-AUD-002 | P0 | Exported totals and exceptions are reproducible from exported rules and events. | The independent verifier recomputes and compares them rather than trusting summary fields. |
| FR-AUD-003 | P0 | Bundle integrity is protected by checksums and a digital signature. | Any changed covered byte causes verification failure; valid signature chains to the bundled/public judge key as documented. |
| FR-AUD-004 | P0 | The verifier works as a static page without a backend. | With network disabled, the page accepts the bundle and returns the same result. |
| FR-AUD-005 | P0 | Verification failures are diagnostic. | Result names the failed check, affected file or event, expected value, and observed value when safe. |
| FR-AUD-006 | P0 | Tamper Lab changes a semantically valid field safely. | It clones the bundle in browser memory, changes one quantity, and never overwrites the original file. |
| FR-AUD-007 | P1 | Verification output is downloadable as a small report. | Report includes verifier version, bundle ID, timestamp, checks run, and result. |

### 10.5 Judge experience and documentation

| ID | Pri. | Requirement | Acceptance criteria |
| --- | --- | --- | --- |
| FR-JDG-001 | P0 | Judge Mode requires no signup, payment, or configuration. | A public link reaches the seeded start screen in one action. |
| FR-JDG-002 | P0 | The core scenario is repeatable. | Reset returns the exact seed-42 starting state and cannot affect other sessions. |
| FR-JDG-003 | P0 | README setup has a hosted path and fresh-clone path. | Every command is executed and recorded before submission; placeholders are gone. |
| FR-JDG-004 | P0 | Demo, README, deployed app, and test output describe the same shipped scope. | Final truth audit finds no feature or metric mismatch. |
| FR-JDG-005 | P0 | Kiro use is inspectable. | Root `.kiro` includes real specs, steering, hooks/configuration used; README and video link use to specific outcomes. |

## 11. Domain rules and invariants

These are the product’s highest-value guarantees.

| ID | Invariant |
| --- | --- |
| INV-001 | **Event preservation:** every unique accepted physical handout remains represented in normalized history. |
| INV-002 | **Idempotent replay:** syncing the same event ID any number of times changes the result no more than syncing it once. |
| INV-003 | **Merge-order independence:** any permutation of the same valid event set produces the same normalized summary and exceptions. |
| INV-004 | **Physical stock conservation:** remaining stock equals initial stock minus every unique accepted physical quantity; entitlement validity never rewrites physical count. |
| INV-005 | **Duplicate visibility:** if two or more physical events reference one entitlement under a one-redemption policy, at least one persistent duplicate exception references all of them. |
| INV-006 | **Bounded local authority:** a device cannot normally record beyond allocated stock, and any server-observed breach becomes visible. |
| INV-007 | **Append-only resolution:** resolving an exception cannot remove or mutate its source events. |
| INV-008 | **Reproducible export:** verifier recomputation from a valid bundle matches its declared summary and exception set. |
| INV-009 | **Tamper evidence:** modifying a covered event, policy, exception, or summary without the signing key causes at least one integrity check to fail. |
| INV-010 | **No beneficiary PII:** the hackathon schema has no field for name, biometric, phone number, or precise home location. |

## 12. Non-functional requirements

### 12.1 Reliability

- NFR-REL-001: A confirmed offline event is committed to durable browser storage before success is shown.
- NFR-REL-002: Sync interruption must leave unacknowledged events queued.
- NFR-REL-003: Judge Mode reset must be deterministic and isolated.
- NFR-REL-004: A clean deployment smoke test must exercise seed, sync, reconcile, export, and verify.

### 12.2 Performance

- NFR-PER-001: After initial provisioning, operator interaction must not wait on a network call.
- NFR-PER-002: On a current mid-range phone, token lookup and event confirmation should complete within 300 ms at the 95th percentile for the demo dataset. **VERIFY measurement before claiming.**
- NFR-PER-003: Reconciliation of 10,000 synthetic events should complete within 2 seconds on the submitted server class. **Target; verify or remove.**
- NFR-PER-004: Static verifier should process a 10 MB bundle within 3 seconds on a typical judge laptop. **Target; verify or remove.**

### 12.3 Accessibility and usability

- NFR-A11Y-001: Target WCAG 2.2 AA for critical flows; do not claim conformance without an audit.
- NFR-A11Y-002: Every action is keyboard-operable, including manual token entry and bundle selection.
- NFR-A11Y-003: Status never relies on color alone.
- NFR-A11Y-004: Focus is visible, ordered, and restored after dialogs.
- NFR-A11Y-005: Offline, queued, syncing, synced, and exception states have text labels announced to assistive technology.
- NFR-A11Y-006: The interface supports 200% zoom and narrow phone layouts without loss of operation.

### 12.4 Security and privacy

- NFR-SEC-001: No secrets are committed; `.env.example` contains safe placeholders only.
- NFR-SEC-002: The server validates every client field and does not trust client-computed totals.
- NFR-SEC-003: Exported archives are parsed with file-count, path, compression-ratio, and size limits.
- NFR-SEC-004: Static verification performs no network upload.
- NFR-SEC-005: Signing private keys remain server-side and are never included in bundles or browser code.
- NFR-SEC-006: Logs exclude raw entitlement tokens and authorization headers.
- NFR-SEC-007: Judge sessions expire and are isolated by unguessable capability tokens or equivalent authorization.

### 12.5 Maintainability

- NFR-MNT-001: Reconciliation is a pure domain function with no database or UI dependency.
- NFR-MNT-002: Shared schemas are versioned and validated at boundaries.
- NFR-MNT-003: Core invariant tests run locally and in CI.
- NFR-MNT-004: Technical decisions that change a core invariant require an ADR and requirement update.

## 13. Information architecture

### Coordinator

- Judge Mode / mission chooser
- Mission overview
- Devices and stock allocation
- Sync activity
- Reconciliation summary
- Exceptions
- Audit export

### Operator

- Offline readiness
- Mission and local stock
- Scan / manual code
- Confirmation
- Local receipt
- Queue and sync status

### Auditor

- Bundle drop zone
- Verification progress
- Valid/invalid result
- Check details
- Tamper Lab

## 14. Success measures

### 14.1 Hackathon success measures

| Measure | Target | How to verify |
| --- | ---: | --- |
| Time from Judge Mode click to first offline handout | ≤ 60 seconds | Screen recording from clean session. |
| Time to visible duplicate exception | ≤ 90 seconds | Screen recording for seed 42. |
| Fresh-clone setup | ≤ 5 minutes excluding image download | Follow `JUDGE-TESTING.md` on clean environment. |
| Seed-42 result | Exact | 4 physical handouts, 96 remaining, 3 unique entitlements, 1 duplicate exception, 2 linked events. |
| Merge-order property | Pass | Property-based suite over randomized permutations. |
| Valid bundle verification | Pass offline | Browser network disabled. |
| Semantically tampered bundle | Fail with diagnostic | Quantity changed from 1 to 2. |
| Critical keyboard flow | Complete | Manual accessibility test. |
| Broken links/placeholders | 0 | Final documentation check. |

### 14.2 Future product measures

These are hypotheses, not hackathon claims:

- exception rate per 1,000 handouts;
- time from final device sync to reconciled report;
- percentage of events synchronized without operator intervention;
- stock variance explained by explicit exceptions;
- auditor time to verify a mission bundle; and
- operator completion time and error rate under offline conditions.

## 15. Launch gates

The release is not ready to submit unless all P0 gates pass:

1. Seed-42 flow succeeds from a clean Judge Mode session three consecutive times.
2. The same flow succeeds with device sync order reversed.
3. Browser reload while offline does not lose confirmed events.
4. Duplicate sync does not alter totals.
5. Valid bundle passes in a network-disabled verifier.
6. Quantity-tampered bundle fails with a specific diagnostic.
7. Fresh-clone commands work exactly as written.
8. Hosted links require no permission request, payment, or private account.
9. No real data, secrets, or raw private keys exist in repository history.
10. README, video, application labels, tests, and submission copy agree on scope.
11. Root `.kiro` directory contains the actual materials used and is not ignored.
12. Participant eligibility has been confirmed under the official rules.

## 16. Risks and mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Service worker behaves inconsistently | Offline demo fails | Cache only required shell/package data; add install-readiness check; test clean and repeat visits in target browser. |
| Camera permission fails | Scan demo stalls | Always provide prominent manual code entry and seeded buttons. |
| Global Judge Mode data becomes polluted | Later judges see wrong state | Create isolated session namespaces and deterministic reset. |
| Reconciliation depends on arrival order | Core guarantee fails | Pure set-based algorithm plus permutation property tests. |
| “Approved offline” wording overpromises | Product appears dishonest | Use “recorded locally, pending sync” consistently. |
| Audit ZIP parser is unsafe | Security and stability issue | Enforce file allowlist, path normalization, size/file-count limits, and in-memory parsing. |
| Signing key configuration breaks deployment | Export/verify demo fails | Startup health check; documented key generation; stable judge deployment; sample bundle fallback that is clearly labeled. |
| Roadmap is mistaken for shipped scope | Score loss or disqualification risk | Status labels and final truth audit across every surface. |
| Generated docs are not personally understood | Weak Kiro/human-direction story | Entrant reviews and refines decisions in Kiro, records real analysis, and can explain invariants. |
| Eligibility is uncertain | Submission disqualified before scoring | Obtain written organizer guidance before submitting if age or jurisdiction is unclear. |

## 17. Dependencies and cost constraints

The planned runtime should not require an AI API or a paid service. The hosted demo may use free hosting/database tiers, but all third-party limits and costs must be listed in the final README. Local evaluation must be possible with open-source dependencies and Docker or an equally clear setup.

Planned dependencies and versions are proposals until pinned in the actual lockfile. See [Architecture](../technical/ARCHITECTURE.md).

## 18. Open decisions for the entrant

Resolve these in Kiro and record the outcome; do not silently assume them:

1. **Stack confirmation:** Next.js single application versus separate API and web apps.
2. **Database:** PostgreSQL in Docker and hosted deployment provider.
3. **Crypto library:** Web Crypto only versus a reviewed Ed25519 library fallback.
4. **Policy updates:** new mission version versus immutable mission with amendment events.
5. **Resolution dispositions:** which categories are needed beyond “explained,” “authorized,” and “investigate.”
6. **Session authorization:** capability URL versus short-lived judge token stored in secure cookie.
7. **Offline package size:** complete token-hash set versus partitioned packages for larger future missions.
8. **Target browsers:** exact versions tested for service worker, camera, IndexedDB, and verification.

## 19. Requirement traceability

Every P0 functional requirement must map to:

- a Kiro EARS requirement;
- a design component or rule;
- one or more implementation tasks;
- at least one automated or manual test; and
- a demo or judge-testing step when user-visible.

The live map is maintained in [Traceability matrix](../process/TRACEABILITY-MATRIX.md).

## 20. Approval record

Before treating this PRD as approved, the entrant should add a real review record:

| Reviewer | Date | Decision | Material changes requested |
| --- | --- | --- | --- |
| **VERIFY** | **VERIFY** | Approve / revise | **VERIFY** |

Approval means the reviewer accepts the product trade-off: Erilog guarantees visibility and reconciliation of offline conflicts, not impossible global prevention while every device is disconnected.
