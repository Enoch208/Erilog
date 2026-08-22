/**
 * Manifest structure for an audit bundle.
 */
export interface BundleManifest {
  schemaVersion: string;
  algorithmVersion: string;
  missionId: string;
  policyVersion: number;
  eventCount: number;
  eventSetDigest: string;
  exportedAt: string;
  keyId: string;
  canonicalization: 'RFC8785';
  files: Record<string, { sha256: string }>;
}
