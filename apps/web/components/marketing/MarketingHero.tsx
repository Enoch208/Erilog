import Link from 'next/link';
import { HERO, ROUTES } from '@/lib/content';

const COLOR_MAP: Record<string, string> = {
  ink: 'text-ink',
  mint: 'text-mint',
  muted: 'text-[#9AA09C]',
};

export function MarketingHero() {
  return (
    <>
      {/* Status badge */}
      <div className="relative z-30 flex justify-center pt-10 -mb-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-evidence pl-3 pr-4 py-2 text-xs font-medium text-white/90">
          <span
            className="h-1.5 w-1.5 rounded-full bg-mint"
            style={{ boxShadow: '0 0 8px rgba(24,184,137,.9)' }}
            aria-hidden="true"
          />
          {HERO.eyebrow}
        </div>
      </div>

      <section className="relative mx-auto max-w-[1240px] px-6 pt-14 pb-10 text-center">
        {/* Headline — large editorial scale */}
        <h1
          className="mx-auto max-w-5xl font-heading tracking-tight"
          style={{ lineHeight: '0.98' }}
        >
          {HERO.headline.map((line, i) => (
            <span
              key={i}
              className={`block text-[2.75rem] sm:text-6xl lg:text-[5.25rem] ${
                COLOR_MAP[line.color] ?? 'text-ink'
              } ${i > 0 ? 'mt-1' : ''}`}
            >
              {line.text}
            </span>
          ))}
        </h1>

        {/* Description */}
        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          {HERO.description}
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={ROUTES.judge}
            className="group inline-flex items-center gap-2 rounded-full bg-evidence px-6 py-3.5 text-sm font-medium text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2"
            style={{ boxShadow: '0 8px 24px -8px rgba(13,19,16,.45)' }}
          >
            Launch Judge Mode
            <span
              className="transition-transform duration-300 group-hover:translate-x-0.5"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
          <Link
            href={ROUTES.verify}
            className="inline-flex items-center rounded-full border border-border bg-surface px-6 py-3.5 text-sm font-medium text-ink transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2"
          >
            Verify a bundle
          </Link>
        </div>

        {/* Truth line */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
          {HERO.truthLine.map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <span
                className="h-1 w-1 rounded-full bg-mint/70"
                aria-hidden="true"
              />
              {item}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
