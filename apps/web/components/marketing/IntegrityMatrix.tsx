import { INTEGRITY_GUARANTEES } from '@/lib/content';

export function IntegrityMatrix() {
  return (
    <section className="mx-auto max-w-wide px-6 py-28" id="integrity">
      <div className="mx-auto max-w-narrow text-center">
        <p className="eyebrow">Integrity contract</p>
        <h2 className="mt-4 text-3xl font-heading tracking-tight sm:text-[2.75rem] sm:leading-[1.1]">
          Guarantees, not
          <br />
          <span className="text-muted">good intentions.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-prose text-base leading-relaxed text-muted">
          Each row below is enforced by a property-based test, not just
          documented in a README.
        </p>
      </div>

      {/* Evidence rows */}
      <div className="mx-auto mt-14 max-w-content overflow-hidden rounded-feature border border-border bg-surface">
        {INTEGRITY_GUARANTEES.map((item, i) => (
          <div
            key={item.claim}
            className={`grid gap-x-8 gap-y-2 px-7 py-6 sm:grid-cols-[1fr_1.4fr] sm:px-9 ${
              i !== 0 ? 'border-t border-border' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-[3px] text-xs text-mint"
                aria-hidden="true"
              >
                ✓
              </span>
              <p className="text-sm font-heading leading-snug text-ink">
                {item.claim}
              </p>
            </div>
            <p className="text-xs leading-relaxed text-muted sm:pt-0.5">
              {item.evidence}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
