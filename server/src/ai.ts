// One small wrapper around the AI API, so the provider can be swapped later.
// It speaks the OpenAI-compatible "chat completions" format, which many providers support.
import type { z } from 'zod';

interface AskOptions<T> {
  system: string;
  text: string;
  imageDataUrls?: string[]; // for Prospekt pages: "data:image/png;base64,..."
  schema: z.ZodType<T>; // the answer is checked with Zod before anyone uses it
  jsonSchema: Record<string, unknown>; // the same shape for the AI (structured output)
}

export function aiConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

export async function askForJson<T>(opts: AskOptions<T>): Promise<T> {
  const key = process.env.AI_API_KEY;
  if (!key) throw new Error('AI_API_KEY is not set');
  const base = process.env.AI_BASE_URL ?? 'https://api.openai.com/v1';
  const model = process.env.AI_MODEL ?? 'gpt-4o-mini';

  const content = [
    { type: 'text', text: opts.text },
    ...(opts.imageDataUrls ?? []).map((url) => ({ type: 'image_url', image_url: { url } })),
  ];

  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content },
      ],
      response_format: { type: 'json_schema', json_schema: { name: 'answer', strict: true, schema: opts.jsonSchema } },
    }),
  });
  if (!res.ok) throw new Error(`AI request failed: ${res.status} ${await res.text()}`);

  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = body.choices?.[0]?.message?.content;
  if (!raw) throw new Error('AI returned no answer');
  return opts.schema.parse(JSON.parse(raw)); // throws if the AI's JSON is not what we asked for
}
