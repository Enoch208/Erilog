import * as ed from '@noble/ed25519';
import { sha256Hex, hexEncode, hexDecode } from './hash-chain.js';

// noble/ed25519 v2 requires sha512 sync for sync API; we use async API instead.
// For Node.js, we need to set up the sha512 function.
import { sha512 } from '@noble/hashes/sha512';
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

/**
 * Generate a new Ed25519 private key (32 random bytes, hex-encoded).
 */
export function generatePrivateKey(): string {
  return hexEncode(ed.utils.randomPrivateKey());
}

/**
 * Derive the public key from a private key (hex-encoded).
 */
export async function getPublicKey(privateKeyHex: string): Promise<string> {
  const pubBytes = await ed.getPublicKeyAsync(hexDecode(privateKeyHex));
  return hexEncode(pubBytes);
}

/**
 * Sign a message (Uint8Array) with an Ed25519 private key.
 * Returns the signature as hex string.
 */
export async function sign(message: Uint8Array, privateKeyHex: string): Promise<string> {
  const sigBytes = await ed.signAsync(message, hexDecode(privateKeyHex));
  return hexEncode(sigBytes);
}

/**
 * Verify an Ed25519 signature.
 */
export async function verify(
  signature: string,
  message: Uint8Array,
  publicKeyHex: string
): Promise<boolean> {
  return ed.verifyAsync(hexDecode(signature), message, hexDecode(publicKeyHex));
}

/**
 * Compute the fingerprint (SHA-256) of a public key for identification.
 */
export async function keyFingerprint(publicKeyHex: string): Promise<string> {
  return sha256Hex(publicKeyHex);
}
