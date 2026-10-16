import { Calculator, Send, ShieldAlert } from 'lucide-react';

const VALUE_PROPS = [
  {
    icon: Calculator,
    label: 'Real rate, not the sticker number',
    tone: 'text-accept',
  },
  {
    icon: ShieldAlert,
    label: 'Client risk, scored automatically',
    tone: 'text-negotiate',
  },
  {
    icon: Send,
    label: 'A counter-offer ready to send',
    tone: 'text-ink-100',
  },
];

/**
 * Hero (PRD §3.5.1): no separate landing page — the "understand it in 30
 * seconds" block sits directly above the entry points. Above the fold on
 * desktop and mobile.
 */
export default function Hero() {
  return (
    <section className="pt-32 pb-10 text-center md:pt-40">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/vetly-full.png" alt="Vetly" className="mx-auto h-9 w-auto" />
      <h1 className="mx-auto mt-6 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-ink-100 md:text-5xl">
        Know what a project offer is really worth before you say yes.
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-300 md:text-lg">
        The real hourly rate after fees and scope creep, a scored client risk, and a clear verdict —
        with a counter-offer ready to send — in seconds.
      </p>
      <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
        {VALUE_PROPS.map((prop) => (
          <div
            key={prop.label}
            className="glass flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left"
          >
            <prop.icon className={`size-5 shrink-0 ${prop.tone}`} />
            <span className="text-sm font-medium text-ink-100">{prop.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
