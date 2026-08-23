import Image from 'next/image';
import { SEED_42 } from '@/lib/content';

export function SeedConflictPreview() {
  return (
    <section className="mx-auto max-w-wide px-6 pb-24" id="product">
      <div className="relative overflow-hidden rounded-feature-lg bg-evidence shadow-2xl shadow-ink/15">
        <div className="relative aspect-[16/10] w-full sm:aspect-video">
          <Image
            src="/hero-evidence-2.png"
            alt="Erilog offline event queue, duplicate-entitlement exception, and signed seed-42 audit bundle"
            fill
            priority
            sizes="(max-width: 1240px) 100vw, 1240px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-evidence/75 via-transparent to-black/5" />
          <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 backdrop-blur-md sm:left-8 sm:top-8">
            <span className="mono text-[9px] uppercase tracking-[0.18em] text-white/75">Seed-42 evidence journey</span>
          </div>
        </div>

        <div className="relative z-10 m-4 -mt-8 rounded-card-lg border border-white/15 bg-[#08100c]/95 p-5 text-white shadow-2xl shadow-black/45 backdrop-blur-md sm:m-6 sm:-mt-14 sm:p-6 lg:absolute lg:bottom-7 lg:left-1/2 lg:m-0 lg:w-[58%] lg:-translate-x-1/2">
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className="text-xs font-medium text-mint">After sync</span>
            <span className="mono text-[9px] uppercase tracking-[0.16em] text-white/35">signed bundle verified</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { value: SEED_42.result.distributed, label: 'distributed' },
              { value: SEED_42.result.remaining, label: 'remaining' },
              { value: SEED_42.result.exceptions, label: 'exception', accent: true },
            ].map((item) => (
              <div key={item.label}>
                <p className={`font-heading text-2xl tabular-nums sm:text-3xl ${item.accent ? 'text-amber' : 'text-white'}`}>{item.value}</p>
                <p className="mono mt-1 text-[8px] uppercase tracking-wider text-white/35 sm:text-[9px]">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="mono text-[10px] text-amber">duplicate_entitlement · {SEED_42.conflictToken}</span>
            <span className="text-[10px] text-white/40">{SEED_42.result.exceptionPeerCount} equal peers · neither erased</span>
          </div>
        </div>
      </div>
    </section>
  );
}
