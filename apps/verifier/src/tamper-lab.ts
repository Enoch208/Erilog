// Placeholder — will be fully implemented in Task 6.3
export interface TamperResult {
  originalValid: boolean;
  tamperedValid: boolean;
  mutation: string;
  failures: Array<{ check: string; file?: string; expected?: string; observed?: string; message: string }>;
}

export async function tamperBundle(
  _zipBytes: Uint8Array,
  _pinnedPublicKeyHex: string,
  _mutation?: { file: string; path: string; from: unknown; to: unknown }
): Promise<TamperResult> {
  throw new Error('Not yet implemented — Task 6.3');
}
