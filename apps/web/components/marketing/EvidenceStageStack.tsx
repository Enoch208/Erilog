import { STAGES } from '@/lib/content';

const STAGE_META = [
  { input: 'Mission package', boundary: 'Local device', output: 'Append-only event' },
  { input: 'Accepted events', boundary: 'Deterministic engine', output: 'Explicit exception' },
  { input: 'Signed ZIP bundle', boundary: 'Static verifier', output: 'Named checks' },
] as const;

export function EvidenceStageStack() {
  return (
    <section className="relative border-y border-border bg-surface py-28" id="how-it-works">
      <div className="relative mx-auto max-w-wide px-6">
        <div className="mx-auto max-w-narrow text-center">
          <p className="text-xl text-mint-dark" style={{ fontFamily: 'var(--font-caveat), cursive' }}>( How evidence survives )</p>
          <h2 className="mt-5 text-4xl font-heading tracking-tight sm:text-6xl sm:leading-[1.02]">
            Three stages. <span className="text-muted">One history.</span>
          </h2>
        </div>

        <div className="mx-auto mt-16 grid max-w-content gap-6 lg:grid-cols-3">
          {STAGES.map((stage, i) => {
            const meta = STAGE_META[i]!;
            return (
              <article key={stage.number} className="flex flex-col rounded-feature border border-border bg-canvas p-8">
                <span className="mono text-[11px] text-mint-dark">STAGE {stage.number}</span>
                <h3 className="mt-4 text-2xl font-heading tracking-tight">{stage.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{stage.description}</p>

                <div className="mt-6 space-y-2 border-t border-border pt-6">
                  {[
                    ['Input', meta.input],
                    ['Boundary', meta.boundary],
                    ['Output', meta.output],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="mono text-[9px] uppercase tracking-[0.16em] text-muted">{label}</span>
                      <span className="text-[13px] text-ink">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint-wash px-3 py-1.5">
                    <span className="h-1 w-1 rounded-full bg-mint" />
                    <span className="mono text-[10px] text-mint-dark">{stage.detail}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
