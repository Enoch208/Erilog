/**
 * Typed content module for the marketing landing page.
 *
 * All seed-42 values come from the frozen fixture.
 * No magic numbers in JSX — read from here.
 */

export const SEED_42 = {
  mission: {
    name: 'Emergency Distribution Alpha',
    totalStock: 100,
    itemType: 'Emergency kit',
  },
  devices: {
    alpha: { label: 'Alpha', allocation: 50 },
    bravo: { label: 'Bravo', allocation: 50 },
  },
  conflictToken: 'HH-042',
  events: {
    total: 4,
    uniqueTokens: 3,
  },
  result: {
    distributed: 4,
    remaining: 96,
    exceptions: 1,
    exceptionType: 'duplicate_entitlement' as const,
    exceptionPeerCount: 2,
  },
} as const;

export const ROUTES = {
  judge: '/judge',
  verify: '/verify',
  github: 'https://github.com/Enoch208/Erilog'
} as const;

export const HERO = {
  eyebrow: 'Offline-first evidence reconciliation',
  headline: [
    { text: 'Offline records', color: 'ink' },
    { text: 'can disagree.', color: 'mint' },
    { text: 'The conflict', color: 'muted' },
    { text: 'cannot disappear.', color: 'ink' },
  ],
  description:
    'Erilog records distributions offline, preserves every accepted event when devices reconnect, and exports a signed audit bundle that anyone can independently verify.',
  truthLine: [
    'No signup',
    'Seeded mission',
    'Offline-capable',
    'Public source',
  ],
} as const;

export const TRUST_CLAIMS = [
  { label: 'Append-only events', description: 'Physical handouts cannot be silently deleted' },
  { label: 'Deterministic reconciliation', description: 'Same events, any order, same result' },
  { label: 'Offline-first recording', description: 'No network required for handout confirmation' },
  { label: 'Independently verifiable bundles', description: 'Static page, no backend, no trust required' },
] as const;

export const STAGES = [
  {
    number: '01',
    title: 'Record offline',
    description:
      'Field operators confirm physical handouts on their device with no network dependency. Each event gets a hash-chained sequence number and is stored in durable local storage.',
    detail: 'Recorded on this device — pending sync',
  },
  {
    number: '02',
    title: 'Reconcile without erasing',
    description:
      'When devices reconnect, every event is accepted exactly once. Duplicate entitlement use becomes an explicit exception — both records remain as peers. No winner is selected.',
    detail: `${SEED_42.result.distributed} distributed · ${SEED_42.result.remaining} remaining · ${SEED_42.result.exceptions} exception`,
  },
  {
    number: '03',
    title: 'Verify independently',
    description:
      'Export a signed audit bundle. Open the static verifier offline. Drag in the bundle. It either passes or names the exact check that failed.',
    detail: 'PASS — all checks passed',
  },
] as const;

export const INTEGRITY_GUARANTEES = [
  { claim: 'Events are append-only', evidence: 'Accepted physical events cannot be deleted via any API or admin operation' },
  { claim: 'Replays cannot create another handout', evidence: 'Same event ID accepted exactly once; retries return already_seen' },
  { claim: 'Merge order cannot change the result', evidence: 'Property-tested: all permutations produce byte-equivalent output' },
  { claim: 'Duplicate entitlements are never silently resolved', evidence: 'Cross-device conflicts become persistent exceptions with all events as peers' },
  { claim: 'Physical stock reflects every accepted event', evidence: 'Stock = initial − sum(all handout quantities), regardless of exception status' },
  { claim: 'Exported evidence contains no beneficiary PII', evidence: 'Schema enforces opaque salted token hashes only — no names, phones, or locations' },
] as const;

export const FAQ_ITEMS = [
  {
    question: 'Does Erilog work offline?',
    answer: 'Yes. Once a mission package is provisioned to a device, handout recording works entirely without network. Events are stored locally and synced when connectivity returns.',
  },
  {
    question: 'Does Erilog choose which conflicting event is correct?',
    answer: 'No. When two devices record against the same entitlement, both events are preserved as equal peers in a duplicate exception. Resolution is a separate decision that appends context — it never deletes evidence.',
  },
  {
    question: 'What does the audit bundle prove?',
    answer: 'The bundle proves internal consistency: the signature matches the manifest, checksums match the files, and recomputing reconciliation from the events produces the declared summary. It does not prove who created the bundle — that requires trust in the signing key.',
  },
  {
    question: 'Does the bundle contain personal information?',
    answer: 'No. The hackathon release uses only opaque salted token hashes. No names, biometrics, phone numbers, or precise locations appear in events or exports.',
  },
  {
    question: 'Can judges run Erilog locally?',
    answer: 'Yes. The README provides a fresh-clone setup path. Docker Compose starts PostgreSQL, and all domain logic runs in Node.js with no paid dependencies.',
  },
  {
    question: 'How was Kiro used?',
    answer: 'Kiro drove the spec-first workflow: requirements → design → tasks → implementation. The .kiro directory contains the real specs, steering rules, and hooks used during development — not generated documentation.',
  },
  {
    question: 'What remains on the roadmap?',
    answer: 'Exception resolution UI, QR code scanning, PWA install prompt, high-contrast theme, and verification report downloads are P1 features not included in the hackathon release. They are clearly labelled as roadmap in the documentation.',
  },
] as const;

export const HONEST_LIMITATION =
  'Erilog cannot determine which physical operator was "right." It guarantees that conflicting records remain visible and inspectable instead of being silently discarded.';
