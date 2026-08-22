import { TRUST_CLAIMS } from '@/lib/content';

export function IntegrityStrip() {
  return (
    <section className="border-y border-border py-14">
      <div className="mx-auto max-w-wide px-6">
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_CLAIMS.map((claim) => (
            <div key={claim.label}>
              <div className="mb-3 h-px w-8 bg-mint" aria-hidden="true" />
              <p className="text-sm font-heading leading-snug text-ink">
                {claim.label}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {claim.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
