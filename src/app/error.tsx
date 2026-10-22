'use client';

import Link from 'next/link';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-4 pt-20 text-center">
      <div className="glass animate-fade-up rounded-3xl p-10">
        <h1 className="text-xl font-semibold text-ink-100">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-300">
          An unexpected error occurred while analyzing the deal.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-ink-100 px-5 py-2.5 text-sm font-semibold text-base-950 transition hover:bg-white"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-5 py-2.5 text-sm font-medium text-ink-300 transition hover:border-white/30 hover:text-ink-100"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
