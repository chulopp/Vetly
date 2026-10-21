import { formatMoney } from '@/lib/currency';
import type { OfferRecord } from '@/lib/offers/service';
import { chatJson } from './deepseek';

export interface DraftOutcome {
  ok: boolean;
  message: string | null;
  error: 'llm_unavailable' | 'llm_invalid_response' | null;
}

/**
 * Stretch feature (PRD §3.3): drafts a ready-to-send negotiation message from
 * the ALREADY-COMPUTED counter-offer — the numbers are fixed by the
 * deterministic engine and the LLM is told never to change them. Failure
 * resolves to { ok: false, message: null } — the raw numbers and conditions
 * are still shown by the UI, so nothing is ever lost.
 */
export async function draftNegotiationMessage(offer: OfferRecord): Promise<DraftOutcome> {
  const counter = offer.analysis.counterOffer;
  if (!counter) {
    return { ok: false, message: null, error: 'llm_invalid_response' };
  }

  const money = (amount: number) => formatMoney(amount, offer.input.currency);

  const system =
    'You draft short, polite, and direct business negotiation emails in English for freelance professionals. ' +
    'The numbers in the user message are fixed by an analysis tool — quote them exactly, never change, round, or invent numbers. ' +
    'Keep the email between roughly 120 and 180 words, no subject line, ready to send as-is. ' +
    'Do NOT use long dash lines (em-dash "—" or en-dash "–") anywhere in your message; use commas, periods, or standard hyphens instead. ' +
    'Respond ONLY with a JSON object: {"message": "<the full email text>"}';

  const lines = [
    'Draft my counter-offer email for a freelance project.',
    `Currency: ${offer.input.currency}`,
    `Their current offer: a total budget of ${money(offer.input.budget)} for about ${offer.input.estimatedHours} hours of work.`,
    `My target hourly rate is ${money(offer.input.targetRate)}, the offer as-is works out to ${money(offer.analysis.effectiveHourlyRate)} per hour (${offer.analysis.profitabilityMargin}% versus my target).`,
  ];

  if (counter.budgetTriggered && counter.suggestedBudget != null) {
    lines.push(
      `I am countering with a total budget of ${money(counter.suggestedBudget)}, phrase this naturally, but this exact total is the minimum number I can accept.`,
    );
  }
  if (counter.budgetTriggered && counter.maxExecutableHours != null && counter.maxExecutableHours > 0) {
    lines.push(
      `Alternatively, if they cannot raise the budget, I can cap the scope at roughly ${counter.maxExecutableHours} focused hours at the current budget.`,
    );
  }
  if (counter.riskTriggered && counter.contractConditions.length > 0) {
    lines.push(`Contract conditions I require, woven in naturally: ${counter.contractConditions.join(' ')}`);
  }

  const raw = await chatJson(
    [
      { role: 'system', content: system },
      { role: 'user', content: lines.join('\n') },
    ],
    15_000,
  );

  if (raw === null) {
    return { ok: false, message: null, error: 'llm_unavailable' };
  }
  const message = (raw as { message?: unknown }).message;
  if (typeof message === 'string' && message.trim().length > 0) {
    const sanitized = message.trim().replace(/\s*[—–]\s*/g, ', ');
    return { ok: true, message: sanitized, error: null };
  }
  return { ok: false, message: null, error: 'llm_invalid_response' };
}
