import Link from 'next/link';
import { ROUTES } from '@/lib/content';

function CheckLine({
  label,
  state,
}: {
  label: string;
  state: 'pass' | 'fail' | 'muted';
}) {
  const glyph = state === 'pass' ? '✓' : state === 'fail' ? '✗' : '·';
  const tone =
    state === 'pass'
      ? 'text-mint'
      : state === 'fail'
        ? 'text-danger'
        : 'text-white/25';

  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <span className={`mono text-xs leading-5 ${tone}`} aria-hidden="true">
        {glyph}
      </span>
      <span className="mono text-[11px] leading-5 text-white/60">{label}</span>
    </div>
  );
}

export function AuditTamperPreview() {
  return (
    <section className="mx-auto max-w-wide px-6 py-28" id="verifier">
      <div className="mx-auto max-w-narrow text-center">
        <p className="eyebrow">Independent verification</p>
        <h2 className="mt-4 text-3xl font-heading tracking-tight sm:text-[2.75rem] sm:leading-[1.1]">
          Change one byte.
          <br />
          <span className="text-muted">The check fails by name.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-prose text-base leading-relaxed text-muted">
          The verifier is a static page with a pinned public key. It recomputes
          reconciliation from the exported events rather than trusting the
          declared summary.
        </p>
      </div>

      {/* Split evidence panel */}
      <div
        className="mt-14 overflow-hidden rounded-feature-lg"
        style={{
          background:
            'radial-gradient(at 50% 0%, #16241D 0%, #0F1713 50%, #0A0F0C 100%)',
        }}
      >
        <div className="grid md:grid-cols-2">
          {/* Valid */}
          <div className="border-b border-white/[0.06] p-8 md:border-b-0 md:border-r sm:p-10">
            <div className="mb-6 flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full bg-mint"
                style={{ boxShadow: '0 0 8px rgba(24,184,137,.8)' }}
              />
              <span className="text-xs font-medium tracking-wide text-mint">
                UNTOUCHED BUNDLE
              </span>
            </div>

            <div className="mb-6 border-y border-white/[0.06] py-3">
              <CheckLine label="manifest complete" state="pass" />
              <CheckLine label="signature valid against pinned key" state="pass" />
              <CheckLine label="event chain integrity" state="pass" />
              <CheckLine label="reconciliation matches summary" state="pass" />
            </div>

            <p className="font-heading text-lg text-white/95">
              PASS
              <span className="ml-2 text-sm font-normal text-white/40">
                all checks passed
              </span>
            </p>
          </div>

          {/* Tampered */}
          <div className="p-8 sm:p-10">
            <div className="mb-6 flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full bg-danger"
                style={{ boxShadow: '0 0 8px rgba(199,63,70,.8)' }}
              />
              <span className="text-xs font-medium tracking-wide text-danger">
                QUANTITY 1 → 2
              </span>
            </div>

            <div className="mb-6 border-y border-white/[0.06] py-3">
              <CheckLine label="manifest complete" state="pass" />
              <CheckLine label="FILE_CHECKSUM_MISMATCH" state="fail" />
              <div className="ml-6 space-y-1 pb-2">
                <p className="mono text-[10px] text-white/30">
                  file: events.json
                </p>
                <p className="mono text-[10px] text-white/30">
                  expected dd208183879c…
                </p>
                <p className="mono text-[10px] text-danger/70">
                  observed e08f20b8c474…
                </p>
              </div>
              <CheckLine label="recomputation mismatch" state="fail" />
            </div>

            <p className="font-heading text-lg text-white/95">
              FAIL
              <span className="ml-2 text-sm font-normal text-white/40">
                integrity violation
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link href={ROUTES.verify} className="btn-primary">
          Open public verifier
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
