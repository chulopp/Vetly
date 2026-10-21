'use client';

import { useState, useEffect } from 'react';
import Hero from '@/components/home/Hero';
import EntryCard from '@/components/home/EntryCard';

export default function HomePage() {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('intake') === 'open' || params.get('prefill')) {
      setExpanded(true);
    }
  }, []);

  function handleStart() {
    setExpanded(true);
    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    }, 80);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24">
      <Hero onStartAnalyzing={handleStart} cardExpanded={expanded} />
      <EntryCard expanded={expanded} onExpand={() => setExpanded(true)} />
    </main>
  );
}
