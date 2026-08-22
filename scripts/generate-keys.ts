/**
 * Generate Ed25519 key pair for Erilog audit bundle signing.
 *
 * Usage: pnpm tsx scripts/generate-keys.ts
 *
 * Output:
 * - Private key (hex) → set as ERILOG_SIGNING_PRIVATE_KEY env var
 * - Public key (hex) → pin in verifier build
 * - Key fingerprint → used as keyId in manifests
 */

import { generatePrivateKey, getPublicKey, keyFingerprint } from '@erilog/crypto';

async function main() {
  const privateKey = generatePrivateKey();
  const publicKey = await getPublicKey(privateKey);
  const fingerprint = await keyFingerprint(publicKey);

  console.log('=== Erilog Ed25519 Key Pair ===\n');
  console.log('Private key (NEVER commit this):');
  console.log(`  ${privateKey}\n`);
  console.log('Public key (pin in verifier build):');
  console.log(`  ${publicKey}\n`);
  console.log('Key fingerprint (used as keyId in manifests):');
  console.log(`  ${fingerprint}\n`);
  console.log('--- Setup ---');
  console.log('1. Add to .env (NEVER commit .env):');
  console.log(`   ERILOG_SIGNING_PRIVATE_KEY="${privateKey}"`);
  console.log('2. Pin public key in apps/verifier/src/pinned-key.ts:');
  console.log(`   export const PINNED_PUBLIC_KEY = '${publicKey}';`);
  console.log('3. Verify fingerprint matches keyId in exported manifests.');
}

main().catch(console.error);
