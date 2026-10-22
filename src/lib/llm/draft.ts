import type { OfferRecord } from '@/lib/offers/service';
import { chatJson } from './deepseek';

export interface DraftOutcome {
  ok: boolean;
  message: string | null;
  error: 'llm_unavailable' | 'llm_invalid_response' | null;
}

/**
 * Formats a clean currency amount for email proposals:
 * Drops awkward decimal cents (.00 or .43) and formats as clean whole numbers.
 */
function cleanMoney(amount: number, currency: string): string {
  const code = currency.trim().toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  } catch {
    return `${code} ${Math.round(amount).toLocaleString('en-US')}`;
  }
}

/**
 * Rounds the counter budget to a realistic, professional freelance quote:
 * For USD/EUR/GBP class currencies, rounds to the nearest ten (e.g. $4,971.43 -> $4,970).
 * For zero-decimal currencies like IDR/JPY, rounds to the nearest 10,000 or 1,000.
 */
function roundCleanBudget(amount: number, currency: string): string {
  const code = currency.trim().toUpperCase();
  const isZeroDecimal = ['IDR', 'JPY', 'KRW', 'VND'].includes(code);
  let rounded: number;
  if (isZeroDecimal) {
    rounded = amount >= 100_000 ? Math.round(amount / 10_000) * 10_000 : Math.round(amount / 1_000) * 1_000;
  } else {
    rounded = Math.round(amount / 10) * 10;
  }
  return cleanMoney(rounded, currency);
}

/**
 * Formats rate as a natural conversational figure, e.g. "around $9/hour" or "around IDR 455,000/hour".
 */
function roundCleanRate(amount: number, currency: string): string {
  const code = currency.trim().toUpperCase();
  const isZeroDecimal = ['IDR', 'JPY', 'KRW', 'VND'].includes(code);
  const rounded = isZeroDecimal ? Math.round(amount / 1_000) * 1_000 : Math.round(amount);
  return `around ${cleanMoney(rounded, currency)}/hour`;
}

/**
 * Stretch feature (PRD §3.3): drafts a ready-to-send reply message:
 * - For ACCEPT deals: drafts a warm, professional acceptance & kickoff message.
 * - For NEGOTIATE / REJECT deals: drafts a negotiation counter-offer derived from the
 *   deterministic engine and presented naturally for a human business conversation.
 * Failure resolves to { ok: false, message: null } — nothing is ever lost.
 */
export async function draftNegotiationMessage(offer: OfferRecord): Promise<DraftOutcome> {
  const isAccept = offer.analysis.recommendAction === 'ACCEPT' || !offer.analysis.counterOffer;
  const counter = offer.analysis.counterOffer;

  const cleanBudget = cleanMoney(offer.input.budget, offer.input.currency);
  const cleanTargetRate = cleanMoney(offer.input.targetRate, offer.input.currency);
  const approxRate = roundCleanRate(offer.analysis.effectiveHourlyRate, offer.input.currency);

  let system: string;
  let lines: string[];

  if (isAccept) {
    system =
      'You draft professional, enthusiastic, and direct business acceptance and project kickoff emails in English for freelance professionals.\n' +
      'Formatting rules:\n' +
      '1. ALWAYS start with "Hi [Client Name]," on the first line.\n' +
      '2. ALWAYS end with "Best regards,\n[Your Name]" on the final lines.\n' +
      '3. Keep the body between roughly 100 and 150 words, warm, enthusiastic, yet professional, ready to send as-is without any subject line.\n' +
      '4. Present monetary figures naturally as conversational figures without awkward cents (e.g. use "total budget of $8,000").\n' +
      '5. NEVER use long dash lines (em-dash "—" or en-dash "–") anywhere in your message. Use commas, periods, or standard hyphens instead.\n' +
      'Respond ONLY with a JSON object: {"message": "<the full email text>"}';

    lines = [
      'Draft my project acceptance and kickoff email for a freelance project.',
      `Currency: ${offer.input.currency}`,
      `Client's offer: total budget of ${cleanBudget} for about ${offer.input.estimatedHours} hours of work.`,
      `Intent: Warmly accept the offer and confirm agreement with the scope and budget.`,
    ];

    if (offer.input.depositPercent > 0) {
      lines.push(
        `Next steps: State that to secure the project on the calendar and commence work, you will follow up with the formal agreement (Scope of Work) and the invoice for the ${offer.input.depositPercent}% upfront deposit.`,
      );
    } else {
      lines.push(
        `Next steps: State that to secure the project on the calendar and commence work, you will follow up with the formal agreement (Scope of Work) and the invoice for the first milestone payment.`,
      );
    }
    lines.push(
      'Closing action: Ask about their availability for a brief kickoff call or to confirm the target kickoff date.',
    );
  } else {
    if (!counter) {
      return { ok: false, message: null, error: 'llm_invalid_response' };
    }

    const deficitRounded = Math.abs(Math.round(offer.analysis.profitabilityMargin));
    const deficitPhrase =
      offer.analysis.profitabilityMargin < 0
        ? `roughly ${deficitRounded}% below my standard target rate`
        : `close to my standard target rate`;

    system =
      'You draft professional, polite, and direct business negotiation emails in English for freelance professionals.\n' +
      'Formatting rules:\n' +
      '1. ALWAYS start with "Hi [Client Name]," on the first line.\n' +
      '2. ALWAYS end with "Best regards,\n[Your Name]" on the final lines.\n' +
      '3. Keep the body between roughly 100 and 160 words, warm yet firm, ready to send as-is without any subject line.\n' +
      '4. Present monetary figures naturally as conversational estimates without awkward cents (e.g. use "around $9/hour", "a budget of $4,970"). NEVER use raw negative percentage formulas like "-69.83%".\n' +
      '5. NEVER use long dash lines (em-dash "—" or en-dash "–") anywhere in your message. Use commas, periods, or standard hyphens instead.\n' +
      'Respond ONLY with a JSON object: {"message": "<the full email text>"}';

    lines = [
      'Draft my counter-offer email for a freelance project.',
      `Currency: ${offer.input.currency}`,
      `Client's current offer: total budget of ${cleanBudget} for about ${offer.input.estimatedHours} hours of work.`,
      `My standard target rate: ${cleanTargetRate}/hour.`,
      `The current offer works out to: ${approxRate} (${deficitPhrase}).`,
    ];

    if (counter.budgetTriggered && counter.suggestedBudget != null) {
      const counterBudgetStr = roundCleanBudget(counter.suggestedBudget, offer.input.currency);
      lines.push(
        `Counter budget for full scope: ${counterBudgetStr}. Express this as a clean, realistic minimum budget to hit my target rate.`,
      );
    }
    if (counter.budgetTriggered && counter.maxExecutableHours != null && counter.maxExecutableHours > 0) {
      lines.push(
        `Scope cap alternative: if their budget is fixed at ${cleanBudget}, offer to cap the scope at roughly ${counter.maxExecutableHours} focused hours.`,
      );
    }
    if (counter.riskTriggered && counter.contractConditions.length > 0) {
      lines.push(`Required project terms to weave in naturally: ${counter.contractConditions.join(' ')}`);
    }
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
    let sanitized = message.trim();

    // 1. Remove all long dashes (em-dash and en-dash)
    sanitized = sanitized.replace(/\s*[—–]\s*/g, ', ').replace(/[—–]/g, '-');

    // 2. Guarantee opening greeting strictly starts with "Hi [Client Name],"
    if (!sanitized.startsWith('Hi [Client Name],')) {
      sanitized = sanitized.replace(/^(dear|hi|hello)\s+[^,\n]+,\s*/i, '');
      sanitized = `Hi [Client Name],\n\n${sanitized.trim()}`;
    }

    // 3. Guarantee closing sign-off strictly ends with "Best regards,\n[Your Name]"
    if (!sanitized.endsWith('Best regards,\n[Your Name]')) {
      sanitized = sanitized.replace(/\n+(best regards|sincerely|warm regards|thanks)[^\n]*(\n+[^\n]+)?$/i, '');
      sanitized = `${sanitized.trim()}\n\nBest regards,\n[Your Name]`;
    }

    // Final safety check against any stray long dashes
    sanitized = sanitized.replace(/[—–]/g, '-');

    return { ok: true, message: sanitized, error: null };
  }
  return { ok: false, message: null, error: 'llm_invalid_response' };
}
