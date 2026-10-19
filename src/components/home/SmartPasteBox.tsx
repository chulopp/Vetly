'use client';

import { useState } from 'react';
import { Info, Sparkles } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

export type PasteStatus = 'idle' | 'loading' | 'success' | 'error';

interface SmartPasteBoxProps {
  status: PasteStatus;
  message: string | null;
  onExtract: (text: string) => void;
}

/**
 * Smart Paste (PRD §3.3) — the single largest interactive element on the Home
 * page and the primary door in. Discloses that the text goes to a third-party
 * LLM API, shows a clear in-progress state, and never blocks the core flow.
 */
export default function SmartPasteBox({ status, message, onExtract }: SmartPasteBoxProps) {
  const [text, setText] = useState('');

  return (
    <div>
      <label
        htmlFor="smart-paste"
        className="text-xs font-medium uppercase tracking-[0.14em] text-ink-500"
      >
        Paste the client&apos;s message or email
      </label>
      <textarea
        id="smart-paste"
        rows={5}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={`Paste the client's message or email here — any language.\nExample: "We have a dashboard project, budget around $8,000, about 120 hours of work, 50% upfront, net 7, two revision rounds."`}
        className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm leading-relaxed text-ink-100 outline-none transition placeholder:text-ink-500 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] focus:border-white/30 focus:ring-2 focus:ring-white/10"
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-ink-500 sm:max-w-[340px]">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Smart Paste sends this text to a third-party AI API (DeepSeek) for extraction — don&apos;t
          paste anything highly sensitive.
        </p>
        <button
          type="button"
          disabled={status === 'loading'}
          onClick={() => onExtract(text)}
          className="flex items-center justify-center gap-2 rounded-xl bg-ink-100 px-5 py-2.5 text-sm font-semibold text-base-950 transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
        >
          {status === 'loading' ? (
            <>
              <Spinner className="size-3.5" />
              Reading the message…
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Extract the offer details
            </>
          )}
        </button>
      </div>
      {message && (
        <p
          className={`mt-2.5 text-xs ${status === 'success' ? 'text-accept' : 'text-reject'}`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
