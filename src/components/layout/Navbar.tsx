'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'bg-base-950/70 backdrop-blur-md border-b border-white/[0.06]' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
        <Link href="/" aria-label="Vetly — home" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vetly-full.png" alt="Vetly" className="h-6 w-auto sm:h-7" />
        </Link>
        <Link
          href="/compare"
          aria-label="Saved offers"
          className="flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-ink-100 transition hover:border-white/40 hover:bg-white/10 sm:px-4 sm:text-sm"
        >
          <span className="hidden sm:inline">Saved offers</span>
          <Bookmark className="size-4 sm:hidden" />
        </Link>
      </nav>
    </header>
  );
}
