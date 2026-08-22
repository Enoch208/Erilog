import { HONEST_LIMITATION } from '@/lib/content';

export function HonestLimitation() {
  return (
    <section className="bg-canvas border-y border-border py-16">
      <div className="section-container">
        <div className="max-w-[700px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-control border border-border bg-surface text-xs text-muted mb-6">
            Honest limitation
          </div>
          <p className="text-lg sm:text-xl font-heading text-ink leading-relaxed">
            {HONEST_LIMITATION}
          </p>
        </div>
      </div>
    </section>
  );
}
