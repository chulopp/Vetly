import Link from 'next/link';
import { Bookmark } from 'lucide-react';

/** Thin, floating glass bar (PRD §4.3): logo lockup left, saved offers link right. */
export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-3 z-50 px-3 sm:px-4">
      <nav className="glass mx-auto flex max-w-4xl items-center justify-between rounded-2xl px-4 py-2.5">
        <Link href="/" aria-label="Vetly — home" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vetly-full.png" alt="Vetly" className="h-7 w-auto" />
        </Link>
        <Link
          href="/compare"
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-ink-300 transition-colors hover:bg-white/5 hover:text-ink-100"
        >
          <Bookmark className="size-4" />
          My saved offers
        </Link>
      </nav>
    </header>
  );
}
