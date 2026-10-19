'use client';

import { Zap } from 'lucide-react';

interface HeroProps {
  onStartAnalyzing?: () => void;
  cardExpanded?: boolean;
}

/**
 * Hero section styled with 99% fidelity to Volta (volta.net):
 * - Optically centered in viewport (min-h-[85vh])
 * - Pill badge: charcoal #181b22, neutral gray text, gray arrow
 * - 2-tier bold headline without period ("Know your / real hourly rate")
 * - Balanced 2-line subheadline without em-dashes
 * - Slim metallic CTA button ("Start analyzing") with left Zap icon
 * - Bilateral tiered horizontal lines on left and right, head crisp near button, tail blurred outwards
 */
export default function Hero({ onStartAnalyzing, cardExpanded }: HeroProps) {
  return (
    <section className="flex min-h-[85vh] flex-col items-center justify-center pt-20 pb-8 text-center">
      {/* Pill Badge - charcoal, gray text, gray arrow */}
      <button
        type="button"
        onClick={onStartAnalyzing}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-[#181b22] px-3.5 py-1 text-xs font-medium text-neutral-400 shadow-sm transition-colors hover:border-white/25 hover:text-neutral-300"
      >
        <span>Introducing Vetly 1.0</span>
        <span className="text-neutral-500">→</span>
      </button>

      {/* 2-tier bold headline with Volta tight tracking - NO period */}
      <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl sm:leading-[1.1]">
        Know your<br />real hourly rate
      </h1>

      {/* Clean 2-line subheadline */}
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ink-300 sm:text-base">
        Calculate your real take-home rate after fees and scope creep, score client risk automatically, and get a ready-to-send counter-offer in seconds for any project.
      </p>

      {/* Volta-style CTA with bilateral tiered lines */}
      <div className="relative mx-auto mt-8 flex items-center justify-center">
        <div className="relative inline-flex items-center">
          {/* Left-side tiered lines: head near button (right), tail blurred outwards (left) */}
          <div
            className="pointer-events-none absolute right-full mr-3 hidden flex-col items-end sm:flex"
            aria-hidden="true"
          >
            {/* Upper line: shorter, head crisp near button, blurred tail on left */}
            <div className="-mt-1 h-px w-20 bg-gradient-to-l from-white/35 via-white/15 to-transparent blur-[0.2px]" />
            {/* Lower line: slightly longer, offset lower and further left */}
            <div className="mt-5 h-px w-28 -translate-x-2 bg-gradient-to-l from-white/25 via-white/10 to-transparent blur-[0.2px]" />
          </div>

          <button
            type="button"
            onClick={onStartAnalyzing}
            aria-expanded={cardExpanded}
            aria-controls="analyze"
            className="btn-volta-cta relative z-10 flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white sm:px-5 sm:py-2 sm:text-sm active:scale-[0.98]"
          >
            <Zap className="size-3.5 text-white sm:size-4" />
            <span>Start analyzing</span>
          </button>

          {/* Right-side tiered lines: head near button (left), tail blurred outwards (right) */}
          <div
            className="pointer-events-none absolute left-full ml-3 hidden flex-col sm:flex"
            aria-hidden="true"
          >
            {/* Upper line: shorter, head crisp near button, blurred tail on right */}
            <div className="-mt-1 h-px w-20 bg-gradient-to-r from-white/35 via-white/15 to-transparent blur-[0.2px]" />
            {/* Lower line: slightly longer, offset lower and further right */}
            <div className="mt-5 h-px w-28 translate-x-2 bg-gradient-to-r from-white/25 via-white/10 to-transparent blur-[0.2px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
