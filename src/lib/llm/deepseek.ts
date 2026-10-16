/**
 * DeepSeek chat client — the only place the LLM provider is wired in
 * (PRD §3.3). Server-only. Never throws: every failure mode (missing key,
 * timeout, non-JSON response, HTTP error) resolves to `null`, so callers
 * degrade gracefully and the deterministic engine is never affected.
 */

const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-chat';

export interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export async function chatJson(messages: ChatMessage[], timeoutMs = 12_000): Promise<unknown | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const baseUrl = process.env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_BASE_URL;
    const model = process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_MODEL;
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: 'json_object' }, // DeepSeek JSON mode
        temperature: 0.2,
        stream: false,
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data: unknown = await response.json();
    const content = (data as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return null;
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  } catch {
    return null; // timeout, network error, abort — never throws
  } finally {
    clearTimeout(timer);
  }
}
