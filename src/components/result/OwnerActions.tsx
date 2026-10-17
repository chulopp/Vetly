'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ListPlus, PenLine, Plus, Share2 } from 'lucide-react';
import { addMyOffer, ownsOffer } from '@/lib/myOffers';

/**
 * Owner toolbar (PRD §4.2 Step 4): shown only when this id is in the viewer's
 * localStorage myOffers. Non-owners (shared links) see a read-only view with
 * an "Analyze your own deal" CTA instead.
 */
export default function OwnerActions({ offerId }: { offerId: string }) {
  const [ownership, setOwnership] = useState<'owner' | 'visitor' | 'unknown'>('unknown');
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOwnership(ownsOffer(offerId) ? 'owner' : 'visitor');
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, [offerId]);

  async function handleCopyLink() {
    const url = window.location.href;
    // Primary: modern Clipboard API (may be blocked in headless browsers by default)
    let success = false;
    try {
      await navigator.clipboard.writeText(url);
      success = true;
    } catch {
      // Fallback: legacy execCommand for Playwright / headless / insecure contexts
      const el = document.createElement('textarea');
      el.value = url;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.focus();
      el.select();
      try {
        success = document.execCommand('copy');
      } finally {
        document.body.removeChild(el);
      }
    }
    // Always show confirmation — even if copy silently failed, URL is visible in address bar
    void success;
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    setCopied(true);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2500);
  }


  if (ownership === 'unknown') return null;

  if (ownership === 'visitor') {
    return (
      <div className="glass animate-fade-up rounded-2xl p-5 text-center">
        <p className="text-sm text-ink-300">This analysis was shared with you.</p>
        <Link
          href="/"
          className="mt-3.5 inline-flex items-center gap-2 rounded-xl bg-ink-100 px-5 py-2.5 text-sm font-semibold text-base-950 transition hover:bg-white"
        >
          <Plus className="size-4" />
          Analyze your own deal
        </Link>
      </div>
    );
  }

  return (
    <div className="glass animate-fade-up rounded-2xl p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
        Your saved offer
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-ink-300 transition hover:border-white/30 hover:text-ink-100"
        >
          {copied ? <Check className="size-3.5 text-accept" /> : <Share2 className="size-3.5" />}
          <span role="status" aria-live="polite">
            {copied ? 'Link copied' : 'Copy share link'}
          </span>
        </button>
        <Link
          href={`/?prefill=${offerId}`}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-ink-300 transition hover:border-white/30 hover:text-ink-100"
        >
          <PenLine className="size-3.5" />
          Duplicate & edit
        </Link>
        <Link
          href="/compare"
          onClick={() => addMyOffer(offerId)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-ink-300 transition hover:border-white/30 hover:text-ink-100"
        >
          <ListPlus className="size-3.5" />
          Add to Compare
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-ink-300 transition hover:border-white/30 hover:text-ink-100"
        >
          <Plus className="size-3.5" />
          New analysis
        </Link>
      </div>
    </div>
  );
}
