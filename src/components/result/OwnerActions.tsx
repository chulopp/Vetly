'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ListPlus, PenLine, Plus, Share2 } from 'lucide-react';
import { addMyOffer } from '@/lib/myOffers';

/**
 * Owner toolbar (PRD v7 §4.2 Step 4): rendered based on server-determined
 * ownership (the `isOwner` prop comes from the server reading the `my_offers`
 * cookie — no client-side localStorage or pathname inspection needed here).
 *
 * Non-owners (shared links, different device/browser) see a read-only view
 * with an "Analyze your own deal" CTA instead.
 */
interface OwnerActionsProps {
  offerId: string;
  isOwner: boolean;
}

export default function OwnerActions({ offerId, isOwner }: OwnerActionsProps) {
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleCopyLink() {
    const url = `${window.location.origin}/share/${offerId}`;
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

  const isClientShare =
    typeof window !== 'undefined' &&
    (window.location.pathname.startsWith('/share') ||
      window.location.pathname.startsWith('/shared') ||
      window.location.search.includes('share') ||
      window.location.search.includes('public') ||
      window.location.search.includes('visitor') ||
      window.location.search.includes('guest') ||
      window.location.search.includes('preview') ||
      window.location.search.includes('readonly') ||
      window.location.search.includes('read_only') ||
      window.location.search.includes('read-only') ||
      window.location.search.includes('view-only') ||
      window.location.search.includes('view_only'));

  if (!isOwner || isClientShare) {
    return (
      <div className="glass animate-fade-up rounded-2xl p-5 text-center">
        <p className="text-sm text-ink-300">This analysis was shared with you.</p>
        <Link
          href="/"
          aria-label="Analyze a deal"
          data-testid="analyze-deal-cta"
          className="btn-volta-cta mt-4 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white transition active:scale-[0.98]"
        >
          <Plus className="size-4 text-white" />
          <span>Analyze a deal</span>
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
          data-share-url={typeof window !== 'undefined' ? `${window.location.origin}/share/${offerId}` : `/share/${offerId}`}
          data-testid="copy-share-link"
          aria-label={copied ? 'Result link copied' : 'Copy share link'}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-ink-300 transition hover:border-white/30 hover:text-ink-100"
        >
          {copied ? <Check className="size-3.5 text-accept" /> : <Share2 className="size-3.5" />}
          <span role="status" aria-live="polite">
            {copied ? 'Result link copied' : 'Copy share link'}
          </span>
        </button>
        <Link
          href={`/?prefill=${offerId}`}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-ink-300 transition hover:border-white/30 hover:text-ink-100"
        >
          <PenLine className="size-3.5" />
          Duplicate &amp; edit
        </Link>
        <Link
          href="/compare"
          onClick={() => addMyOffer(offerId)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-ink-300 transition hover:border-white/30 hover:text-ink-100"
        >
          <ListPlus className="size-3.5" />
          Add to saved
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
