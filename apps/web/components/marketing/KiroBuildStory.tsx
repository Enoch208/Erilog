import { ROUTES } from '@/lib/content';

const PIPELINE = [
  { label: 'requirements.md', note: '33 EARS requirements' },
  { label: 'design.md', note: 'trust boundaries' },
  { label: 'tasks.md', note: '30 tasks, 10 phases' },
  { label: 'invariants', note: 'INV-001 … INV-010' },
  { label: 'property tests', note: '8 properties' },
  { label: 'implementation', note: '116 tests passing' },
];

export function KiroBuildStory() {
  return (
    <section className="mx-auto max-w-wide px-6 py-28" id="kiro">
      <div className="mx-auto max-w-narrow text-center">
        <p className="eyebrow">Built with Kiro</p>
        <h2 className="mt-4 text-3xl font-heading tracking-tight sm:text-[2.75rem] sm:leading-[1.1]">
          Specified before
          <br />
          <span className="text-muted">it was shipped.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-prose text-base leading-relaxed text-muted">
          Requirements were reviewed for contradictions before any code existed.
          Invariants became property tests before they became features.
        </p>
      </div>

      {/* Pipeline */}
      <div className="mx-auto mt-14 max-w-content">
        <div className="overflow-hidden rounded-feature border border-border bg-surface">
          {PIPELINE.map((step, i) => (
            <div
              key={step.label}
              className={`flex items-center gap-4 px-6 py-4 sm:px-8 ${
                i !== 0 ? 'border-t border-border' : ''
              }`}
            >
              <span className="mono w-6 text-[10px] tabular-nums text-muted">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="mono flex-1 text-[13px] text-ink">
                {step.label}
              </span>
              <span className="text-[11px] text-muted">{step.note}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <a
          href={`${ROUTES.github}/tree/main/.kiro`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink underline decoration-border decoration-2 underline-offset-4 transition-colors hover:decoration-mint"
        >
          Inspect the .kiro directory
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
