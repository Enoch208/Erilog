import { ROUTES } from '@/lib/content';

const PROOF = [
  ['requirements.md', '33 EARS requirements'],
  ['design.md', 'trust boundaries'],
  ['property tests', '8 properties'],
  ['implementation', 'automated checks'],
] as const;

export function KiroBuildStory() {
  return (
    <section className="mx-auto max-w-wide px-6 py-24" id="kiro">
      <div className="grid overflow-hidden rounded-feature-lg border border-border bg-surface lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-gradient-to-br from-mint to-mint-dark p-8 text-white sm:p-12">
          <p className="text-xl text-white/80" style={{ fontFamily: 'var(--font-caveat), cursive' }}>( Built with Kiro )</p>
          <h2 className="mt-5 text-4xl font-heading tracking-tight sm:text-5xl">Specified before it was shipped.</h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-white/70">Requirements were checked for contradictions before implementation. Invariants became tests before they became features.</p>
          <a href={`${ROUTES.github}/tree/main/.kiro`} target="_blank" rel="noopener noreferrer" className="group mt-8 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-white underline decoration-white/30 decoration-2 underline-offset-4 hover:decoration-white">Inspect the real spec <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span></a>
        </div>
        <div className="divide-y divide-border p-4 sm:p-8">
          {PROOF.map(([label, note], index) => <div key={label} className="flex items-center gap-4 px-3 py-5"><span className="mono text-[9px] text-mint">0{index + 1}</span><span className="mono flex-1 text-[12px] text-ink">{label}</span><span className="text-right text-[10px] text-muted">{note}</span></div>)}
        </div>
      </div>
    </section>
  );
}
