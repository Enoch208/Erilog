import { TRUST_CLAIMS } from '@/lib/content';

export function IntegrityStrip() {
  return (
    <section className="py-14">
      <div className="mx-auto max-w-wide border-y border-ink/10 px-6 py-8">
        <p className="mb-7 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-muted">Built around evidence, not connectivity</p>
        <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-6 lg:flex-nowrap lg:justify-between">
          {TRUST_CLAIMS.map((claim, index) => (
            <div key={claim.label} className="group flex max-w-[245px] items-start gap-3">
              <span className="mono mt-0.5 text-[10px] text-mint">0{index + 1}</span>
              <div>
                <p className="text-sm font-heading leading-snug text-ink transition-colors group-hover:text-mint-dark">{claim.label}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{claim.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
