import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DatabaseNotConfiguredError } from '@/lib/db/client';
import { draftNegotiationMessage } from '@/lib/llm/draft';
import { getOffer, saveDraftMessage } from '@/lib/offers/service';
import { OFFER_ID_PATTERN, zodToIssues } from '@/lib/validation/offer';

const DraftRequestSchema = z.object({
  offerId: z
    .string({ invalid_type_error: 'offerId must be a string.', required_error: 'offerId is required.' })
    .regex(OFFER_ID_PATTERN, 'Invalid offer id.'),
});

/**
 * POST /api/draft — stretch feature (PRD §3.3): drafts a ready-to-send
 * negotiation message from the ALREADY-COMPUTED stored counter-offer. The
 * LLM never changes any number. Failure returns { ok: false, message: null }
 * — the raw counter-offer numbers are unaffected.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'PARSE_ERROR', issues: [{ field: 'body', message: 'Request body must be valid JSON.' }] },
      { status: 400 },
    );
  }

  const parsed = DraftRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', issues: zodToIssues(parsed.error) }, { status: 400 });
  }

  try {
    const offer = await getOffer(parsed.data.offerId);
    if (!offer) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'No saved offer with this id.' },
        { status: 404 },
      );
    }
    if (offer.draftMessage) {
      return NextResponse.json({ ok: true, message: offer.draftMessage });
    }
    const outcome = await draftNegotiationMessage(offer); // never throws
    if (outcome.ok && outcome.message) {
      try {
        await saveDraftMessage(offer.id, outcome.message);
      } catch (saveError) {
        console.error('[POST /api/draft] failed to persist draft message:', saveError);
      }
    }
    return NextResponse.json(outcome);
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return NextResponse.json(
        { error: 'DATABASE_NOT_CONFIGURED', message: 'Saved offers are unavailable, DATABASE_URL is not set.' },
        { status: 503 },
      );
    }
    console.error('[POST /api/draft] failed:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong while drafting the message.' },
      { status: 500 },
    );
  }
}
