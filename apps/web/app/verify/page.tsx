import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingHeader } from '@/components/marketing/MarketingHeader';
import { MarketingFooter } from '@/components/marketing/MarketingFooter';
import { VerifyClient } from '@/components/verify/VerifyClient';
import { ROUTES } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Verify an audit bundle · Erilog',
  description:
    'Check an Erilog audit bundle in your browser. Signature, checksums, and reconciliation are recomputed locally, and failures are named per file.',
};

export default function VerifyPage() {
  return (
    <>
      <MarketingHeader />
      <main className="section-container pb-24 pt-8 sm:pt-12">
        <div className="max-w-narrow">
          <p className="eyebrow">Independent verification</p>
          <h1 className="mt-3 text-4xl font-heading leading-[1.05] tracking-[-0.03em] text-ink sm:text-5xl">
            Verify an audit bundle
          </h1>
          <p className="mt-5 max-w-prose text-base leading-relaxed text-muted">
            Erilog&apos;s guarantee only matters if someone outside the system can check it. This page
            runs the same verification the headless proof runs — archive safety limits, Ed25519
            signature, per-file SHA-256 checksums, and a full reconciliation recomputation — entirely
            in your browser.
          </p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
            {[
              'Runs client-side',
              'Nothing is uploaded',
              'Named failures, not "invalid"',
              'Same core as pnpm demo:headless',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span aria-hidden="true" className="h-1 w-1 rounded-full bg-mint" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={ROUTES.judge} className="btn-secondary">
              Need a bundle? Open Judge Mode
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <VerifyClient />
        </div>

        <section
          aria-labelledby="verify-trust-heading"
          className="mt-14 max-w-narrow rounded-card border border-border bg-surface p-6 sm:p-7"
        >
          <h2 id="verify-trust-heading" className="text-lg font-heading text-ink">
            What this does and does not prove
          </h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
            <p>
              A passing result means the bundle&apos;s evidence files are byte-for-byte what the signing
              key committed to, and that the declared summary, exceptions, and event-set digest are
              exactly what the recorded events produce when reconciled again.
            </p>
            <p>
              It does not prove that a field operator entered a physically true claim, and it cannot
              protect a signing key that has already been compromised. It also does not re-check
              per-device allocation limits: the recomputation uses a deliberately large allocation, so
              device overspend is reported by the operational system rather than re-derived here.
            </p>
            <p>
              Loading the key from this deployment is a convenience. Independent verification means
              obtaining the public key out of band and pasting it above.
            </p>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
