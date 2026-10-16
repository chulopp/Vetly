'use client';

import { useState } from 'react';
import { Check, Copy, Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

type DraftStatus = 'idle' | 'loading' | 'done' | 'error';

/**
 * Stretch feature (PRD §3.3): drafts a ready-to-send negotiation message from
 * the already-computed counter-offer. Failure just leaves this section inert
 * — the counter-offer numbers and conditions are unaffected, nothing is lost.
 */
export default function DraftMessage({ offerId }: { offerId: string }) {
  const [status, setStatus] = useState<DraftStatus>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleDraft() {
    if (status === 'loading') return;
    setStatus('loading');
    setMessage(null);
    try {
      const response = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId }),
      });
      const data: unknown = await response.json().catch(() => null);
      if (
        response.ok &&
        data &&
        (data as { ok?: unknown }).ok === true &&
        typeof (data as { message?: unknown }).message === 'string'
      ) {
        setMessage((data as { message: string }).message);
        setStatus('done');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  async function handleCopy() {
    if (!message) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable — the text is still visible and selectable
    }
  }

  return (
    <div className="glass animate-fade-up rounded-2xl p-5">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
        Need help sending it?
      </div>
      <button
        type="button"
        onClick={handleDraft}
        disabled={status === 'loading'}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-negotiate/40 bg-negotiate/10 px-4 py-2.5 text-sm font-semibold text-negotiate transition hover:bg-negotiate/20 disabled:cursor-wait disabled:opacity-60"
      >
        {status === 'loading' ? (
          <>
            <Spinner className="size-3.5" />
            Drafting…
          </>
        ) : (
          <>
            <Sparkles className="size-4" />
            Draft a negotiation message
          </>
        )}
      </button>

      {status === 'error' && (
        <p className="mt-2.5 text-xs text-ink-500">
          Couldn&apos;t draft a message — your counter-offer numbers above are all you need.
        </p>
      )}

      {status === 'done' && message && (
        <div className="mt-3.5 animate-fade-up">
          <div className="whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-relaxed text-ink-100">
            {message}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'mt-2.5 flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-ink-300 transition hover:border-white/30 hover:text-ink-100',
            )}
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-accept" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy message
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
