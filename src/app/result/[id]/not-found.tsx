import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function OfferNotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-4 pt-20 text-center">
      <div className="glass animate-fade-up rounded-3xl p-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vetly-icon.png" alt="" className="mx-auto h-14 w-auto" />
        <h1 className="mt-5 text-xl font-semibold text-ink-100">
          This offer doesn&apos;t exist or was never saved.
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-300">
          The share link may be mistyped, or the offer was never created.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-ink-100 px-5 py-2.5 text-sm font-semibold text-base-950 transition hover:bg-white"
          >
            <Plus className="size-4" />
            Analyze your own deal
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-ink-300 transition hover:border-white/30 hover:text-ink-100"
          >
            Analyze a deal
          </Link>
        </div>
      </div>
    </main>
  );
}
