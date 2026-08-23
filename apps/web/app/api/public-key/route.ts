import { NextResponse } from 'next/server';
import { getPublicKey, keyFingerprint } from '@erilog/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Publish the Ed25519 *public* key used to sign audit bundles.
 *
 * An Ed25519 public key is safe to expose: it verifies signatures but cannot
 * produce them, and the private key cannot be derived from it. The private key
 * never leaves the server.
 *
 * Trust note: fetching this key from the same origin that signed the bundle is
 * a convenience, not an independent check. A genuinely independent auditor
 * should obtain the key out of band and paste it into the verifier, which the
 * /verify page supports.
 */
export async function GET() {
  const privateKeyHex = process.env.ERILOG_SIGNING_PRIVATE_KEY;
  if (!privateKeyHex) {
    return NextResponse.json({ error: 'Signing key not configured' }, { status: 503 });
  }

  try {
    const publicKey = await getPublicKey(privateKeyHex);
    const fingerprint = await keyFingerprint(publicKey);

    return NextResponse.json(
      {
        publicKey,
        fingerprint,
        algorithm: 'Ed25519',
        note: 'Public verification key only. Obtain out of band for independent verification.',
      },
      { headers: { 'Cache-Control': 'public, max-age=300' } }
    );
  } catch {
    return NextResponse.json({ error: 'Could not derive public key' }, { status: 500 });
  }
}
