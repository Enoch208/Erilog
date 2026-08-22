import { HONEST_LIMITATION } from '@/lib/content';

export function HonestLimitation() {
  return (
    <section className="border-y border-border bg-surface py-24">
      <div className="mx-auto max-w-wide px-6">
        <div className="mx-auto max-w-narrow">
          <div className="mb-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
            <span className="mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Honest limitation
            </span>
            <span className="h-px flex-1 bg-border" aria-hidden="true" />
          </div>
          <p className="text-center text-xl font-heading leading-[1.45] tracking-tight text-ink sm:text-[26px]">
            {HONEST_LIMITATION}
          </p>
        </div>
      </div>
    </section>
  );
}
