'use client';

import { useState } from 'react';
import { Check, Copy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type DraftStatus = 'idle' | 'loading' | 'done' | 'error';

interface DraftMessageProps {
  offerId: string;
  initialDraft?: string | null;
}

/**
 * Stretch feature (PRD §3.3): drafts a ready-to-send negotiation message from
 * the already-computed counter-offer. Stored in DB so each analysis generates
 * at most once and persists across visits.
 */
export default function DraftMessage({ offerId, initialDraft }: DraftMessageProps) {
  const [status, setStatus] = useState<DraftStatus>(initialDraft ? 'done' : 'idle');
  const [message, setMessage] = useState<string | null>(initialDraft ?? null);
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
      {(!message || status !== 'done') && (
        <button
          type="button"
          onClick={handleDraft}
          disabled={status === 'loading'}
          className="btn-volta-cta mt-3 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium text-white transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
        >
          {status === 'loading' ? (
            <>
              <Sparkles className="size-4 animate-pulse text-amber-300" />
              <span>Drafting…</span>
            </>
          ) : (
            <>
              <Sparkles className="size-4 text-white" />
              <span>Draft a negotiation message</span>
            </>
          )}
        </button>
      )}

      {status === 'error' && (
        <p className="mt-2.5 text-xs text-ink-500">
          Couldn&apos;t draft a message. Your counter-offer numbers above are all you need.
        </p>
      )}

      {status === 'done' && message && (
        <div className="relative mt-3.5 animate-fade-up">
          <div className="whitespace-pre-wrap rounded-xl border border-white/10 bg-white/[0.04] p-4 pr-12 text-sm leading-relaxed text-ink-100">
            {message}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Copied' : 'Copy message'}
            title={copied ? 'Copied!' : 'Copy message'}
            className="group absolute top-3 right-3 flex items-center justify-center rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/[0.06] hover:text-white active:scale-95"
          >
            {copied ? (
              <Check className="size-4 text-accept" />
            ) : (
              <Copy className="size-4" />
            )}
            <span className="pointer-events-none absolute -top-8 right-0 z-20 rounded bg-base-950/90 px-1.5 py-0.5 text-[10px] font-medium text-ink-100 opacity-0 shadow-md backdrop-blur transition-opacity group-hover:opacity-100">
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
