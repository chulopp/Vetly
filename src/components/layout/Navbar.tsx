'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bookmark } from 'lucide-react';

export default function Navbar() {
  const [visible, setVisible] = useState(true);
  const prevScrollYRef = useRef(0);

  useEffect(() => {
    function onScroll() {
      const currentScrollY = window.scrollY;
      const prevScrollY = prevScrollYRef.current;

      if (currentScrollY > 60 && currentScrollY > prevScrollY) {
        // Scrolling down -> hide navbar
        setVisible(false);
      } else {
        // Scrolling up or at top -> show navbar
        setVisible(true);
      }
      prevScrollYRef.current = currentScrollY;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 bg-transparent transition-transform duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
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
          className="flex items-center justify-center rounded-full bg-white px-3.5 py-1 text-xs font-semibold text-black shadow-sm transition hover:bg-neutral-100 sm:px-4 sm:py-1.5"
        >
          <span className="hidden sm:inline">Saved offers</span>
          <Bookmark className="size-3.5 fill-black text-black sm:hidden" />
        </Link>
      </nav>
    </header>
  );
}
