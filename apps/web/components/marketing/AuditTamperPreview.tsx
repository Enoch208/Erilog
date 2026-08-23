import Link from 'next/link';
import { HONEST_LIMITATION, INTEGRITY_GUARANTEES, ROUTES } from '@/lib/content';

function CheckLine({ label, state }: { label: string; state: 'pass' | 'fail' }) {
  return <div className="flex items-start gap-2.5 py-1.5"><span className={`mono text-xs leading-5 ${state === 'pass' ? 'text-mint' : 'text-danger'}`} aria-hidden="true">{state === 'pass' ? '✓' : '✗'}</span><span className="mono text-[11px] leading-5 text-white/60">{label}</span></div>;
}

export function AuditTamperPreview() {
  const coreGuarantees = INTEGRITY_GUARANTEES.slice(0, 3);

  return (
    <section className="relative overflow-hidden border-y border-border bg-surface px-6 py-28" id="verifier">
      <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 select-none whitespace-nowrap font-heading text-[6rem] text-ink/[0.035] sm:text-[12rem] lg:text-[15rem]" aria-hidden="true">VERIFY</div>
      <div className="relative mx-auto max-w-wide">
        <div className="mx-auto max-w-narrow text-center">
          <p className="text-xl text-mint-dark" style={{ fontFamily: 'var(--font-caveat), cursive' }}>( Proof, not promises )</p>
          <h2 className="mt-5 text-4xl font-heading tracking-tight sm:text-6xl sm:leading-[1.03]">Change one byte. <span className="text-muted">The check fails by name.</span></h2>
          <p className="mx-auto mt-7 max-w-prose text-base leading-relaxed text-muted">The verifier recomputes reconciliation from the exported events rather than trusting the summary it receives. It runs in your browser — the bundle is never uploaded.</p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={ROUTES.verify}
              className="group inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-mint px-8 py-4 text-base font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-mint-dark hover:shadow-2xl hover:shadow-mint/40 active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2 sm:w-auto"
            >
              Verify a bundle now
              <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
            </Link>
            <Link href={ROUTES.judge} className="btn-secondary w-full cursor-pointer sm:w-auto">
              Export one from Judge Mode
            </Link>
          </div>
        </div>

        <div className="mt-16 overflow-hidden rounded-feature-lg bg-[radial-gradient(circle_at_50%_0%,#1b352a_0%,#0f1713_48%,#080d0a_100%)] shadow-2xl shadow-ink/20">
          <div className="grid md:grid-cols-2">
            <div className="border-b border-white/[0.07] p-8 sm:p-10 md:border-b-0 md:border-r"><div className="mb-7 flex items-center justify-between"><span className="text-xs font-medium tracking-wide text-mint">UNTOUCHED BUNDLE</span><span className="mono text-[9px] text-white/60">valid</span></div><div className="mb-7 border-y border-white/[0.07] py-4"><CheckLine label="manifest complete" state="pass" /><CheckLine label="signature valid against pinned key" state="pass" /><CheckLine label="event chain integrity" state="pass" /><CheckLine label="reconciliation matches summary" state="pass" /></div><p className="font-heading text-2xl text-white">PASS <span className="ml-2 text-sm font-normal text-white/70">all checks passed</span></p></div>
            <div className="p-8 sm:p-10"><div className="mb-7 flex items-center justify-between"><span className="text-xs font-medium tracking-wide text-danger">QUANTITY 1 → 2</span><span className="mono text-[9px] text-white/60">tampered</span></div><div className="mb-7 border-y border-white/[0.07] py-4"><CheckLine label="manifest complete" state="pass" /><CheckLine label="FILE_CHECKSUM_MISMATCH" state="fail" /><div className="ml-6 space-y-1 pb-2"><p className="mono text-[10px] text-white/60">file: events.json</p><p className="mono text-[10px] text-danger/70">observed e08f20b8c474…</p></div><CheckLine label="recomputation mismatch" state="fail" /></div><p className="font-heading text-2xl text-white">FAIL <span className="ml-2 text-sm font-normal text-white/70">integrity violation</span></p></div>
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {coreGuarantees.map((item, index) => <div key={item.claim} className="rounded-card border border-border bg-canvas p-5"><span className="mono text-[9px] text-mint-dark">0{index + 1}</span><p className="mt-3 text-sm font-heading text-ink">{item.claim}</p><p className="mt-2 text-xs leading-relaxed text-muted">{item.evidence}</p></div>)}
        </div>

        <div className="mt-8 flex flex-col gap-6 rounded-card-lg border-l-2 border-mint bg-mint-wash/40 p-6 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-3xl text-sm leading-relaxed text-ink"><span className="font-heading">The honest limit:</span> {HONEST_LIMITATION}</p><Link href={ROUTES.verify} className="btn-primary group shrink-0 cursor-pointer">Open verifier <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span></Link></div>
      </div>
    </section>
  );
}
