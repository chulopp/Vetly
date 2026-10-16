import { NextResponse } from 'next/server';
import { analyzeOffer } from '@/lib/engine';
import { DatabaseNotConfiguredError } from '@/lib/db/client';
import { createOffer, listOffers } from '@/lib/offers/service';
import { OFFER_ID_PATTERN, OfferInputSchema, zodToIssues } from '@/lib/validation/offer';

/**
 * POST /api/offers — create an offer analysis (PRD §4.2 Step 3).
 * Zod validates every §3.4 rule (structured 400 on any violation), the pure
 * deterministic engine computes the analysis, and the result is saved to Neon
 * with a generated id.
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

  const parsed = OfferInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', issues: zodToIssues(parsed.error) }, { status: 400 });
  }

  const analysis = analyzeOffer(parsed.data);

  try {
    const id = await createOffer(parsed.data, analysis);
    return NextResponse.json({ id, analysis }, { status: 201 });
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return NextResponse.json(
        { error: 'DATABASE_NOT_CONFIGURED', message: 'Offers cannot be saved yet — DATABASE_URL is not set.' },
        { status: 503 },
      );
    }
    console.error('[POST /api/offers] failed to save offer:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong while saving the offer.' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/offers?ids=a,b,c — fetch saved offers for the Compare page.
 * Malformed ids or more than 50 -> 400. Unknown ids are silently omitted
 * (a cleared browser is not an error). Ordered newest first.
 */
export async function GET(request: Request) {
  const idsParam = new URL(request.url).searchParams.get('ids');
  if (idsParam === null) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', issues: [{ field: 'ids', message: 'Provide a comma-separated ids query parameter.' }] },
      { status: 400 },
    );
  }

  const ids = idsParam
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (ids.length === 0) {
    return NextResponse.json({ offers: [] });
  }
  if (ids.some((id) => !OFFER_ID_PATTERN.test(id))) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', issues: [{ field: 'ids', message: 'One or more offer ids are invalid.' }] },
      { status: 400 },
    );
  }
  if (ids.length > 50) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', issues: [{ field: 'ids', message: 'Too many ids requested (max 50).' }] },
      { status: 400 },
    );
  }

  try {
    const offers = await listOffers(ids);
    return NextResponse.json({ offers });
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return NextResponse.json(
        { error: 'DATABASE_NOT_CONFIGURED', message: 'Saved offers are unavailable — DATABASE_URL is not set.' },
        { status: 503 },
      );
    }
    console.error('[GET /api/offers] failed to list offers:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong while loading saved offers.' },
      { status: 500 },
    );
  }
}
