import { STAGES } from '@/lib/content';

export function EvidenceStageStack() {
  return (
    <section className="py-24 sm:py-32 bg-surface border-y border-border">
      <div className="section-container">
        <div className="max-w-[720px] mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading tracking-tight mb-4">
            Three steps. One guarantee.
          </h2>
          <p className="text-muted">
            From offline recording to independently verified evidence.
          </p>
        </div>

        <div className="space-y-8 max-w-[900px] mx-auto">
          {STAGES.map((stage) => (
            <div
              key={stage.number}
              className="rounded-feature border border-border bg-canvas p-8 sm:p-10 lg:sticky lg:top-24"
              style={{ zIndex: parseInt(stage.number, 10) }}
            >
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                <div className="flex-shrink-0">
                  <span className="text-5xl font-heading text-border select-none">
                    {stage.number}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-heading mb-3">{stage.title}</h3>
                  <p className="text-muted leading-relaxed mb-4">
                    {stage.description}
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-control bg-mint-wash text-mint-dark text-xs mono">
                    {stage.detail}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
