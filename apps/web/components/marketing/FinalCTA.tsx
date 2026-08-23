import Link from 'next/link';
import { ROUTES } from '@/lib/content';

export function FinalCTA() {
  return (
    <section className="mx-auto max-w-wide px-6 py-20 sm:py-28">
      <div className="relative overflow-hidden rounded-feature-lg bg-[radial-gradient(ellipse_at_18%_120%,#1d4937_0%,#0d1712_48%,#060907_100%)] px-8 py-20 text-white shadow-2xl shadow-ink/20 sm:px-14 sm:py-24">
        <div className="pointer-events-none absolute right-[7%] top-[12%] hidden w-64 rotate-3 rounded-2xl border border-white/10 bg-white/[0.035] p-5 opacity-60 lg:block">
          <div className="mb-4 flex items-center justify-between"><span className="mono text-[9px] text-white/35">bundle / seed-42</span><span className="h-1.5 w-1.5 rounded-full bg-mint" /></div>
          <div className="space-y-2"><div className="h-2 w-3/4 rounded-full bg-mint/50" /><div className="h-2 w-full rounded-full bg-white/10" /><div className="h-2 w-2/3 rounded-full bg-white/10" /></div>
          <p className="mono mt-5 text-[9px] text-mint">PASS · all checks passed</p>
        </div>
        <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full border border-white/[0.055]" />

        <div className="relative max-w-3xl">
          <p className="text-xl text-mint" style={{ fontFamily: 'var(--font-caveat), cursive' }}>( Try the evidence journey )</p>
          <h2 className="mt-5 text-4xl font-heading leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">See what survives when two offline histories disagree.</h2>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-white/50">Run the seeded conflict, inspect the preserved peer events, and verify the resulting audit bundle independently.</p>

          <div className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Link href={ROUTES.judge} className="group inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-ink shadow-xl shadow-black/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0 active:scale-[0.98]">Launch Judge Mode <span className="transition-transform group-hover:translate-x-1" aria-hidden="true">→</span></Link>
            <Link href={ROUTES.verify} className="inline-flex cursor-pointer items-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-medium text-white/85 transition-all duration-300 hover:border-white/30 hover:bg-white/[0.05] active:scale-[0.98]">Verify an audit bundle</Link>
            <a href={ROUTES.github} target="_blank" rel="noopener noreferrer" className="cursor-pointer px-4 py-3.5 text-sm font-medium text-white/45 transition-colors hover:text-white">View source</a>
          </div>
        </div>
      </div>
    </section>
  );
}
