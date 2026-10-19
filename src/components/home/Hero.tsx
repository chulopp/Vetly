'use client';

import { Zap } from 'lucide-react';

interface HeroProps {
  onStartAnalyzing?: () => void;
  cardExpanded?: boolean;
}

/**
 * Hero section styled with 99% fidelity to Volta (volta.net):
 * - Pill badge: solid black, crisp white text, white arrow ("Introducing Vetly 1.0 →")
 * - Punchy 4-word headline without period ("Know your real rate")
 * - Balanced 2-line subheadline without em-dashes
 * - Slim metallic CTA button ("Start analyzing") with left Zap icon, no right arrow
 * - Two tiered horizontal lines exclusively on the right of the CTA, with blur fade-out
 */
export default function Hero({ onStartAnalyzing, cardExpanded }: HeroProps) {
  return (
    <section className="pt-28 pb-4 text-center md:pt-36">
      {/* Pill Badge ala Volta "See what's new in v1.17.0 →" - solid black, white text */}
      <button
        type="button"
        onClick={onStartAnalyzing}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black px-3.5 py-1 text-xs font-medium text-white shadow-sm transition-colors hover:border-white/30"
      >
        <span>Introducing Vetly 1.0</span>
        <span className="text-white">→</span>
      </button>

      {/* 4-word bold headline with Volta tight tracking - NO period */}
      <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-6xl sm:leading-[1.1]">
        Know your real rate
      </h1>

      {/* Clean 2-line subheadline */}
      <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ink-300 sm:text-base">
        Calculate your real take-home rate after fees and scope creep, score client risk automatically, and get a ready-to-send counter-offer in seconds for any project.
      </p>

      {/* Volta-style CTA with right-side tiered lines */}
      <div className="relative mx-auto mt-8 flex items-center justify-center">
        <div className="relative inline-flex items-center">
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

          {/* Tiered lines exclusively on the right side, fading & blurring towards the tail */}
          <div
            className="pointer-events-none absolute left-full ml-3 hidden flex-col sm:flex"
            aria-hidden="true"
          >
            {/* Upper line: shorter, crisp at left header, blurred/fading at right tail */}
            <div className="-mt-1 h-px w-20 bg-gradient-to-r from-white/35 via-white/15 to-transparent blur-[0.2px]" />
            {/* Lower line: slightly longer, offset lower and further right */}
            <div className="mt-5 h-px w-28 translate-x-2 bg-gradient-to-r from-white/25 via-white/10 to-transparent blur-[0.2px]" />
          </div>
        </div>
      </div>
    </section>
  );
}
