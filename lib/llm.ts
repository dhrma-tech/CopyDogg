import Anthropic from "@anthropic-ai/sdk";

/**
 * The one place that talks to an AI provider. Prompts live in lib/claude.ts;
 * this file only sends them. Server-side only.
 *
 * Which provider: AI_PROVIDER ("claude" or "gemini") if set, otherwise
 * whichever key is present, Claude first. No key at all means demo mode.
 */
export type ProviderId = "anthropic" | "gemini";

const PROVIDER_LABELS: Record<ProviderId, string> = { anthropic: "Claude", gemini: "Gemini" };
const ANTHROPIC_MODEL = "claude-opus-5";
// An alias Google keeps pointed at its current Flash model, which has a free tier.
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest";

function pickProvider(): ProviderId | null {
  const keys: Record<ProviderId, boolean> = {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
  };
  const choice = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (choice === "claude" || choice === "anthropic") return keys.anthropic ? "anthropic" : null;
  if (choice === "gemini" || choice === "google") return keys.gemini ? "gemini" : null;
  if (keys.anthropic) return "anthropic";
  if (keys.gemini) return "gemini";
  return null;
}

export const provider = pickProvider();
export const providerLabel = provider ? PROVIDER_LABELS[provider] : "the AI";

export type Effort = "low" | "medium";

interface TextRequest {
  system: string;
  user: string;
  maxTokens: number;
  /** Claude only: how hard to think. Gemini uses its own default. */
  effort: Effort;
}

/** Streams the response text as it's written. Aborting `signal` cancels the call. */
export function streamText(req: TextRequest, signal?: AbortSignal): AsyncGenerator<string> {
  return provider === "gemini" ? geminiStream(req, signal) : anthropicStream(req, signal);
}

/** Returns raw JSON text matching `schema`, or null if the model refused. */
export function generateJson(req: TextRequest & { schema: object }): Promise<string | null> {
  return provider === "gemini" ? geminiJson(req) : anthropicJson(req);
}

// ---------------------------------------------------------------------------
// Errors: say what actually went wrong, in plain words.
// ---------------------------------------------------------------------------

class ProviderError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function errorDetails(err: unknown): { status: number; message: string } {
  if (err instanceof ProviderError) return { status: err.status, message: err.message };
  if (err instanceof Anthropic.APIError) {
    const body = err.error as { error?: { message?: string } } | undefined;
    return { status: err.status ?? 0, message: body?.error?.message ?? err.message };
  }
  return { status: 0, message: err instanceof Error ? err.message : String(err) };
}

/** A message for the person using the app. Also logs the raw error to the terminal. */
export function aiErrorMessage(err: unknown): string {
  const { status, message } = errorDetails(err);
  console.error(`[${providerLabel}] ${status || "network"}: ${message}`);
  const name = providerLabel;
  const text = message.toLowerCase();

  if (provider === "gemini" && status === 429) {
    return "You've hit Gemini's usage limit. On the free tier that's a few requests a minute: wait a minute and try again. If it keeps happening, today's free quota is used up.";
  }
  if (text.includes("credit balance") || text.includes("billing") || text.includes("quota")) {
    return `Your ${name} account is out of credit or quota. Add credit (or wait for the free quota to reset), then try again.`;
  }
  if (status === 401 || status === 403 || text.includes("api key not valid")) {
    return `Your ${name} API key was rejected. Check it in .env.local, then restart the app.`;
  }
  if (status === 404 && provider === "gemini") {
    return `Gemini doesn't know the model "${GEMINI_MODEL}". Fix GEMINI_MODEL in .env.local, then restart the app.`;
  }
  if (status === 429) return `Too many requests to ${name} right now. Wait a minute and try again.`;
  if (status >= 500) return `${name} is busy or down right now. Try again in a minute.`;
  return `Couldn't reach ${name}. Check your API key and connection, then try again.`;
}

// ---------------------------------------------------------------------------
// Claude
// ---------------------------------------------------------------------------

let anthropicClient: Anthropic | undefined;
function anthropic(): Anthropic {
  anthropicClient ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropicClient;
}

async function* anthropicStream(req: TextRequest, signal?: AbortSignal): AsyncGenerator<string> {
  const stream = anthropic().messages.stream(
    {
      model: ANTHROPIC_MODEL,
      max_tokens: req.maxTokens,
      output_config: { effort: req.effort },
      system: req.system,
      messages: [{ role: "user", content: req.user }],
    },
    { signal }
  );

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      yield event.delta.text;
    }
  }
}

async function anthropicJson(req: TextRequest & { schema: object }): Promise<string | null> {
  const response = await anthropic().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: req.maxTokens,
    output_config: {
      effort: req.effort,
      format: { type: "json_schema", schema: req.schema as Record<string, unknown> },
    },
    system: req.system,
    messages: [{ role: "user", content: req.user }],
  });

  if (response.stop_reason === "refusal") return null;
  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text : null;
}

// ---------------------------------------------------------------------------
// Gemini (REST, no SDK)
// ---------------------------------------------------------------------------

interface GeminiPart {
  text?: string;
  thought?: boolean;
}
interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

const GEMINI_BLOCKED = new Set(["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII", "RECITATION"]);

// Flash is often "experiencing high demand" (503). Flash-Lite usually isn't,
// so the default model falls back to it once. A model you chose never does.
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_MODEL?.trim() ? null : "gemini-flash-lite-latest";

async function geminiFetch(
  method: string,
  body: object,
  signal?: AbortSignal,
  model = GEMINI_MODEL
): Promise<Response> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${method}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
    },
    body: JSON.stringify(body),
    signal,
  });
  if (response.status === 503 && GEMINI_FALLBACK_MODEL && model !== GEMINI_FALLBACK_MODEL) {
    await response.body?.cancel();
    return geminiFetch(method, body, signal, GEMINI_FALLBACK_MODEL);
  }
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new ProviderError(response.status, data?.error?.message ?? response.statusText);
  }
  return response;
}

function geminiBody(req: TextRequest) {
  return {
    systemInstruction: { parts: [{ text: req.system }] },
    contents: [{ role: "user", parts: [{ text: req.user }] }],
  };
}

/** Visible text only: thinking-model "thought" parts are skipped. */
function geminiText(data: GeminiResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts
    .filter((p) => !p.thought && p.text)
    .map((p) => p.text)
    .join("");
}

async function* geminiStream(req: TextRequest, signal?: AbortSignal): AsyncGenerator<string> {
  const response = await geminiFetch("streamGenerateContent?alt=sse", geminiBody(req), signal);
  if (!response.body) throw new ProviderError(0, "Empty response");

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const text = geminiText(JSON.parse(line.slice(5)) as GeminiResponse);
      if (text) yield text;
    }
  }
}

async function geminiJson(req: TextRequest & { schema: object }): Promise<string | null> {
  const response = await geminiFetch("generateContent", {
    ...geminiBody(req),
    generationConfig: { responseMimeType: "application/json", responseJsonSchema: req.schema },
  });
  const data = (await response.json()) as GeminiResponse;
  const finish = data.candidates?.[0]?.finishReason;
  if (data.promptFeedback?.blockReason || (finish && GEMINI_BLOCKED.has(finish))) return null;
  return geminiText(data) || null;
}
