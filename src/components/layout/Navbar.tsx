'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BookmarkSimple } from '@phosphor-icons/react';

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
          prefetch={false}
          aria-label="Saved offers"
          className="btn-volta-cta flex items-center justify-center rounded-full px-3.5 py-1 text-xs font-medium text-white sm:px-4 sm:py-1.5"
        >
          <span className="hidden sm:inline">Saved offers</span>
          <BookmarkSimple className="size-3.5 text-white sm:hidden" weight="light" />
        </Link>
      </nav>
    </header>
  );
}
