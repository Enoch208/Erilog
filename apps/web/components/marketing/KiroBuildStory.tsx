import { ROUTES } from '@/lib/content';

const PIPELINE = [
  'requirements.md',
  'design.md',
  'tasks.md',
  'invariants',
  'property tests',
  'implementation',
];

export function KiroBuildStory() {
  return (
    <section className="section-container py-24 sm:py-32" id="kiro">
      <div className="max-w-[720px] mx-auto text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-heading tracking-tight mb-4">
          Specified before it was shipped.
        </h2>
        <p className="text-muted text-lg leading-relaxed">
          Kiro drove the spec-first workflow from requirements through property-tested
          implementation. The <span className="mono text-ink">.kiro</span> directory
          contains the real materials used.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 max-w-[700px] mx-auto">
        {PIPELINE.map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-control border border-border bg-surface text-xs mono">
              {step}
            </span>
            {i < PIPELINE.length - 1 && (
              <span className="text-border text-lg" aria-hidden="true">→</span>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <a
          href={`${ROUTES.github}/tree/main/.kiro`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-mint-dark hover:text-mint underline underline-offset-4"
        >
          View .kiro directory on GitHub
        </a>
      </div>
    </section>
  );
}
