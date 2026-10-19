'use client';

interface HeroProps {
  onStartAnalyzing?: () => void;
  cardExpanded?: boolean;
}

/**
 * Hero section styled after Volta (volta.net):
 * - Pill badge replacing centered logo ("Introducing Vetly 1.0 →")
 * - Punchy 4-word headline ("Know your real rate.")
 * - Tight 2-line subheadline without em-dashes
 * - Volta-style pill CTA ("Start analyzing →") centered on a subtle horizontal divider line
 */
export default function Hero({ onStartAnalyzing, cardExpanded }: HeroProps) {
  return (
    <section className="pt-28 pb-4 text-center md:pt-36">
      {/* Pill Badge ala Volta "See what's new in v1.17.0 →" */}
      <button
        type="button"
        onClick={onStartAnalyzing}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1 text-xs font-medium text-ink-300 shadow-sm backdrop-blur-sm transition-colors hover:border-white/30 hover:text-ink-100"
      >
        <span>Introducing Vetly 1.0</span>
        <span className="text-white/60">→</span>
      </button>

      {/* 4-word bold headline with Volta tight tracking */}
      <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-6xl sm:leading-[1.1]">
        Know your real rate.
      </h1>

      {/* Clean 2-line subheadline */}
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-ink-300 sm:text-base">
        Real hourly rate after fees and scope creep, client risk scoring, and counter-offers ready to send in seconds.
      </p>

      {/* Volta-style CTA with horizontal divider line */}
      <div className="relative mx-auto mt-8 flex max-w-xl items-center justify-center">
        <div className="absolute inset-x-0 h-px bg-white/10" />
        <button
          type="button"
          onClick={onStartAnalyzing}
          aria-expanded={cardExpanded}
          aria-controls="analyze"
          className="relative z-10 flex items-center gap-2 rounded-full border border-white/20 bg-[#121520] px-6 py-2.5 text-sm font-medium text-white shadow-lg backdrop-blur-md transition-all hover:border-white/40 hover:bg-[#181d2c] active:scale-[0.98]"
        >
          <span>Start analyzing</span>
          <span className="text-ink-300">→</span>
        </button>
      </div>
    </section>
  );
}
