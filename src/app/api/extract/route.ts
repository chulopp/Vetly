import { NextResponse } from 'next/server';
import { z } from 'zod';
import { extractOfferFields } from '@/lib/llm/extract';
import { zodToIssues } from '@/lib/validation/offer';

const ExtractRequestSchema = z.object({
  text: z
    .string({
      invalid_type_error: 'Paste the client message first.',
      required_error: 'Paste the client message first.',
    })
    .trim()
    .min(1, 'Paste the client message first.')
    .max(20_000, 'The message is too long (max 20,000 characters).'),
});

/**
 * POST /api/extract — Smart Paste (PRD §3.3). Isolated from the deterministic
 * engine and the database: this route only pre-fills a form for user review.
 * The response is schema-stable ({ ok, fields, error }) with every field
 * present or explicitly null, so assertions can target the schema rather
 * than the LLM's non-deterministic text.
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

  const parsed = ExtractRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', issues: zodToIssues(parsed.error) }, { status: 400 });
  }

  const outcome = await extractOfferFields(parsed.data.text); // never throws
  return NextResponse.json(outcome);
}
