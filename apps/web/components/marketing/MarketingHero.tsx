import Link from 'next/link';
import { HERO, ROUTES } from '@/lib/content';

const COLOR_MAP: Record<string, string> = {
  ink: 'text-ink',
  mint: 'text-mint',
  muted: 'text-muted',
};

export function MarketingHero() {
  return (
    <section className="section-container pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
      {/* Eyebrow */}
      <p className="text-sm font-medium text-muted tracking-wide uppercase mb-6">
        {HERO.eyebrow}
      </p>

      {/* Headline */}
      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading leading-[1.15] tracking-tight max-w-[720px] mx-auto mb-8">
        {HERO.headline.map((line, i) => (
          <span key={i} className={`block ${COLOR_MAP[line.color] ?? 'text-ink'}`}>
            {line.text}
          </span>
        ))}
      </h1>

      {/* Description */}
      <p className="text-lg text-muted max-w-[600px] mx-auto mb-10 leading-relaxed">
        {HERO.description}
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
        <Link href={ROUTES.judge} className="btn-primary">
          Launch Judge Mode
        </Link>
        <Link href={ROUTES.verify} className="btn-secondary">
          Verify a bundle
        </Link>
      </div>

      {/* Truth Line */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
        {HERO.truthLine.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-mint" aria-hidden="true" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
