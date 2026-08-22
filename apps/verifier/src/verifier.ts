// Placeholder — will be fully implemented in Task 6.2
export interface VerificationResult {
  valid: boolean;
  failures: VerificationFailure[];
}

export interface VerificationFailure {
  check: string;
  file?: string;
  expected?: string;
  observed?: string;
  message: string;
}

export async function verifyBundle(
  _zipBytes: Uint8Array,
  _pinnedPublicKeyHex: string
): Promise<VerificationResult> {
  throw new Error('Not yet implemented — Task 6.2');
}
