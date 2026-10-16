import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-4 pt-20 text-center">
      <div className="glass animate-fade-up rounded-3xl p-10">
        <h1 className="text-xl font-semibold text-ink-100">This page doesn&apos;t exist.</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-300">
          The link may be mistyped, or the page moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-xl bg-ink-100 px-5 py-2.5 text-sm font-semibold text-base-950 transition hover:bg-white"
        >
          Back to analyzing deals
        </Link>
      </div>
    </main>
  );
}
