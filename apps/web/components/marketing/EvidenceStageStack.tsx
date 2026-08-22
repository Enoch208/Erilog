import { STAGES } from '@/lib/content';

export function EvidenceStageStack() {
  return (
    <section className="border-y border-border bg-surface py-28">
      <div className="mx-auto max-w-wide px-6">
        <div className="mx-auto max-w-narrow text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-4 text-3xl font-heading tracking-tight sm:text-[2.75rem] sm:leading-[1.1]">
            Three steps.
            <br />
            <span className="text-muted">One guarantee.</span>
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-content space-y-5">
          {STAGES.map((stage, i) => (
            <article
              key={stage.number}
              className="grid gap-8 rounded-feature border border-border bg-canvas p-8 sm:p-12 lg:grid-cols-[auto_1fr] lg:gap-12"
            >
              {/* Number */}
              <div className="lg:w-24">
                <span
                  className="mono block text-[3.5rem] font-heading leading-none text-border"
                  aria-hidden="true"
                >
                  {stage.number}
                </span>
              </div>

              {/* Content */}
              <div className="max-w-prose">
                <h3 className="text-xl font-heading sm:text-2xl">
                  {stage.title}
                </h3>
                <p className="mt-4 text-base leading-relaxed text-muted">
                  {stage.description}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-control border border-mint/25 bg-mint-wash px-3.5 py-2">
                  <span
                    className="h-1 w-1 rounded-full bg-mint"
                    aria-hidden="true"
                  />
                  <span className="mono text-[11px] text-mint-dark">
                    {stage.detail}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
