import { TRUST_CLAIMS } from '@/lib/content';

export function IntegrityStrip() {
  return (
    <section className="border-y border-border py-12 bg-surface">
      <div className="section-container">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {TRUST_CLAIMS.map((claim) => (
            <div key={claim.label} className="text-center sm:text-left">
              <p className="text-sm font-heading text-ink mb-1">{claim.label}</p>
              <p className="text-xs text-muted">{claim.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
