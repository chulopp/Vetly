'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-base-950 text-ink-100">
        <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-4 pt-20 text-center">
          <div className="glass rounded-3xl p-10">
            <h1 className="text-xl font-semibold text-ink-100">Something went wrong</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-300">
              An unexpected application error occurred.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-ink-100 px-5 py-2.5 text-sm font-semibold text-base-950 transition hover:bg-white"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
