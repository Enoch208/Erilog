'use client';

import { useState } from 'react';
import { FAQ_ITEMS } from '@/lib/content';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-wide px-6 py-28" id="faq">
      <div className="mx-auto max-w-prose">
        <div className="text-center">
          <p className="eyebrow">Questions</p>
          <h2 className="mt-4 text-3xl font-heading tracking-tight sm:text-[2.5rem]">
            Answered plainly.
          </h2>
        </div>

        <div className="mt-12 overflow-hidden rounded-feature border border-border bg-surface">
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              className={i !== 0 ? 'border-t border-border' : undefined}
            >
              <button
                type="button"
                className="flex min-h-[60px] w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-canvas/60 sm:px-7"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
                aria-controls={`faq-answer-${i}`}
              >
                <span className="text-sm font-heading leading-snug text-ink">
                  {item.question}
                </span>
                <span
                  className="flex-shrink-0 text-base text-muted transition-transform duration-300"
                  style={{
                    transform:
                      openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
              {openIndex === i && (
                <div
                  id={`faq-answer-${i}`}
                  className="px-6 pb-6 sm:px-7"
                >
                  <p className="max-w-[54ch] text-[13px] leading-relaxed text-muted">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
