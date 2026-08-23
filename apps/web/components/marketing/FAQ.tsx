'use client';

import { AddCircleIcon, MinusSignCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import { FAQ_ITEMS } from '@/lib/content';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative mx-auto max-w-content overflow-hidden px-6 py-32" id="faq">
      <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 select-none font-heading text-[7rem] text-ink/[0.035] sm:text-[13rem]" aria-hidden="true">FAQ</div>
      <div className="relative text-center">
        <p className="text-xl text-mint" style={{ fontFamily: 'var(--font-caveat), cursive' }}>( Questions )</p>
        <h2 className="mt-5 text-4xl font-heading tracking-tight sm:text-6xl">Answered <span className="text-muted">plainly.</span></h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted">The shortest honest answers to how Erilog records, reconciles, and verifies evidence.</p>
      </div>

      <div className="relative mt-14 grid items-start gap-4 md:grid-cols-2">
        {FAQ_ITEMS.slice(0, 5).map((item, index) => {
          const open = openIndex === index;
          return (
            <article key={item.question} className={`self-start rounded-card-lg border bg-surface shadow-sm transition-all duration-300 hover:shadow-md ${open ? 'border-mint/30 shadow-mint/5' : 'border-border'}`}>
              <button type="button" className="flex min-h-[72px] w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left" onClick={() => setOpenIndex(open ? null : index)} aria-expanded={open} aria-controls={`faq-answer-${index}`}>
                <span className="text-sm font-heading leading-snug text-ink">{item.question}</span>
                <HugeiconsIcon icon={open ? MinusSignCircleIcon : AddCircleIcon} size={20} strokeWidth={1.5} className={`shrink-0 transition-colors ${open ? 'text-mint' : 'text-muted'}`} aria-hidden="true" />
              </button>
              <div id={`faq-answer-${index}`} className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="min-h-0"><p className="max-w-[54ch] px-6 pb-6 text-[13px] leading-relaxed text-muted">{item.answer}</p></div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
