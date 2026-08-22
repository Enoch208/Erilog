import { INTEGRITY_GUARANTEES } from '@/lib/content';

export function IntegrityMatrix() {
  return (
    <section className="bg-surface border-y border-border py-24 sm:py-32" id="integrity">
      <div className="section-container">
        <div className="max-w-[720px] mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading tracking-tight mb-4">
            Integrity contract.
          </h2>
          <p className="text-muted">
            Every guarantee is property-tested, not just documented.
          </p>
        </div>

        <div className="max-w-[800px] mx-auto space-y-4">
          {INTEGRITY_GUARANTEES.map((item) => (
            <div
              key={item.claim}
              className="flex flex-col sm:flex-row sm:items-start gap-3 p-5 rounded-card border border-border bg-canvas"
            >
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-mint-wash flex items-center justify-center mt-0.5">
                <span className="text-[10px] text-mint-dark font-bold">✓</span>
              </div>
              <div>
                <p className="text-sm font-heading mb-1">{item.claim}</p>
                <p className="text-xs text-muted">{item.evidence}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
