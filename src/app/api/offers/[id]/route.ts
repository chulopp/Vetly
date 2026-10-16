import { NextResponse } from 'next/server';
import { DatabaseNotConfiguredError } from '@/lib/db/client';
import { getOffer } from '@/lib/offers/service';
import { OFFER_ID_PATTERN } from '@/lib/validation/offer';

/**
 * GET /api/offers/[id] — one saved offer: share links, Duplicate & edit
 * prefill, and TestSprite assertions. Malformed id -> 400; unknown -> 404.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!OFFER_ID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', issues: [{ field: 'id', message: 'Invalid offer id.' }] },
      { status: 400 },
    );
  }

  try {
    const offer = await getOffer(id);
    if (!offer) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'No saved offer with this id.' },
        { status: 404 },
      );
    }
    return NextResponse.json({ offer });
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return NextResponse.json(
        { error: 'DATABASE_NOT_CONFIGURED', message: 'Saved offers are unavailable — DATABASE_URL is not set.' },
        { status: 503 },
      );
    }
    console.error('[GET /api/offers/:id] failed to load offer:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Something went wrong while loading the offer.' },
      { status: 500 },
    );
  }
}
