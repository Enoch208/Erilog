import Link from 'next/link';
import { ROUTES } from '@/lib/content';

export function AuditTamperPreview() {
  return (
    <section className="section-container py-24 sm:py-32" id="verifier">
      <div className="max-w-[720px] mx-auto text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-heading tracking-tight mb-4">
          Tamper-evident. Independently verifiable.
        </h2>
        <p className="text-muted text-lg">
          Export a signed audit bundle. Verify it offline in a static page.
          Change one byte and watch the check fail by name.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
        {/* Valid state */}
        <div className="rounded-card-lg border border-mint/40 bg-mint-wash/30 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-mint" />
            <span className="text-sm font-heading text-mint-dark">Valid bundle</span>
          </div>
          <div className="space-y-2 text-xs mono text-mint-dark/80">
            <div>✓ Manifest complete</div>
            <div>✓ Signature valid against pinned key</div>
            <div>✓ Event chain integrity</div>
            <div>✓ Reconciliation matches declared summary</div>
          </div>
          <div className="mt-4 pt-3 border-t border-mint/20">
            <div className="text-sm font-heading text-mint-dark">
              PASS — all checks passed
            </div>
          </div>
        </div>

        {/* Tampered state */}
        <div className="rounded-card-lg border border-red/40 bg-red/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red" />
            <span className="text-sm font-heading text-red">Tampered bundle</span>
          </div>
          <div className="space-y-2 text-xs mono text-ink/70">
            <div>Mutation: quantity 1 → 2</div>
            <div className="text-red font-medium">✗ FILE_CHECKSUM_MISMATCH</div>
            <div className="text-muted pl-3">File: events.json</div>
            <div className="text-muted pl-3 truncate">Expected: dd2081838...</div>
            <div className="text-muted pl-3 truncate">Observed: e08f20b8c...</div>
          </div>
          <div className="mt-4 pt-3 border-t border-red/20">
            <div className="text-sm font-heading text-red">
              FAIL — integrity violation detected
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-10">
        <Link href={ROUTES.verify} className="btn-primary">
          Open public verifier
        </Link>
      </div>
    </section>
  );
}
