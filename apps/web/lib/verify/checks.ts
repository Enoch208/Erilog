/**
 * Presentation metadata for the verification layers.
 *
 * The verifier core reports failures by `check` code. This maps those codes to
 * the ordered, human-readable layers shown on /verify so a reviewer can see
 * exactly which stage failed instead of a generic "invalid bundle".
 */

export interface CheckLayer {
  id: string;
  title: string;
  description: string;
  /** Failure codes from `verifyBundle` that belong to this layer. */
  codes: string[];
}

export const CHECK_LAYERS: CheckLayer[] = [
  {
    id: 'archive',
    title: 'Archive safety',
    description: 'Path, entry-count, size, and compression-ratio limits before any content is parsed.',
    codes: [
      'PATH_TRAVERSAL',
      'DUPLICATE_ENTRY',
      'MAX_FILE_COUNT',
      'MAX_FILE_SIZE',
      'MAX_TOTAL_SIZE',
      'COMPRESSION_RATIO',
      'MISSING_REQUIRED',
      'UNREADABLE_ARCHIVE',
      'archive_safety',
    ],
  },
  {
    id: 'manifest',
    title: 'Manifest parse',
    description: 'manifest.json must be strict, well-formed JSON.',
    codes: ['manifest_parse'],
  },
  {
    id: 'signature',
    title: 'Ed25519 signature',
    description: 'The signature must verify against the pinned public key over the canonical manifest bytes.',
    codes: ['signature'],
  },
  {
    id: 'key',
    title: 'Key identity',
    description: 'The manifest key fingerprint must match the pinned key.',
    codes: ['key_id_mismatch'],
  },
  {
    id: 'completeness',
    title: 'Manifest completeness',
    description: 'No declared file missing, no undeclared file smuggled in.',
    codes: ['manifest_completeness'],
  },
  {
    id: 'checksums',
    title: 'File checksums',
    description: 'Every evidence file must match its recorded SHA-256.',
    codes: ['file_checksum'],
  },
  {
    id: 'recomputation',
    title: 'Reconciliation recomputation',
    description: 'Summary, exceptions, and event-set digest are recomputed from the events themselves.',
    codes: [
      'recomputation',
      'recomputation_summary',
      'recomputation_exceptions',
      'recomputation_digest',
    ],
  },
];

export function layerForCode(code: string): CheckLayer | undefined {
  return CHECK_LAYERS.find((layer) => layer.codes.includes(code));
}
