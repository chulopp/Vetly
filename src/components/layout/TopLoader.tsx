'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function TopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const activeRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (activeRef.current) return;
    clearTimers();
    activeRef.current = true;
    setVisible(true);
    setProgress(18);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 88) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 88;
        }
        if (prev < 40) return prev + 12;
        if (prev < 70) return prev + 6;
        return prev + 2;
      });
    }, 200);
  }, [clearTimers]);

  const complete = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;
    clearTimers();
    setProgress(100);

    fadeTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      resetTimeoutRef.current = setTimeout(() => {
        setProgress(0);
      }, 200);
    }, 250);
  }, [clearTimers]);

  // Complete when pathname or searchParams change
  useEffect(() => {
    if (activeRef.current) {
      complete();
    }
  }, [pathname, searchParams, complete]);

  // Global listeners for internal link clicks, browser history, and programmatic navigation
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement)?.closest('a');
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;

        // Same page with same params or just hash change
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }

        start();
      } catch {
        // invalid URL, ignore
      }
    }

    function handlePopState() {
      start();
    }

    // Intercept pushState and replaceState for router.push()
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      try {
        const targetUrl = args[2];
        if (targetUrl) {
          const parsed = new URL(String(targetUrl), window.location.href);
          if (parsed.href !== window.location.href) {
            start();
          }
        }
      } catch {
        // ignore
      }
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      try {
        const targetUrl = args[2];
        if (targetUrl) {
          const parsed = new URL(String(targetUrl), window.location.href);
          if (parsed.href !== window.location.href) {
            start();
          }
        }
      } catch {
        // ignore
      }
      return originalReplaceState.apply(this, args);
    };

    document.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      window.removeEventListener('popstate', handlePopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      clearTimers();
    };
  }, [start, clearTimers]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[2px] transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden="true"
    >
      <div
        className="h-full bg-white transition-[width] ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? '200ms' : '300ms',
          boxShadow: '0 0 8px rgba(255, 255, 255, 0.7), 0 0 2px rgba(255, 255, 255, 0.9)',
        }}
      />
    </div>
  );
}
