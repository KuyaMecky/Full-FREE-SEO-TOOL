import { getAIConfig, AIProvider } from "./config";

export interface GenerateOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

export class AINotConfiguredError extends Error {
  constructor() {
    super("AI_NOT_CONFIGURED");
    this.name = "AINotConfiguredError";
  }
}

export async function generateText(opts: GenerateOptions): Promise<string> {
  const cfg = await getAIConfig();
  if (!cfg) throw new AINotConfiguredError();

  const maxTokens = opts.maxTokens ?? 4000;
  const temperature = opts.temperature;

  switch (cfg.provider) {
    case "anthropic":
      return callAnthropic({ ...opts, maxTokens, temperature }, cfg.apiKey, cfg.model);
    case "openai":
      return callOpenAI({ ...opts, maxTokens, temperature }, cfg.apiKey, cfg.model);
    case "gemini":
      return callGemini({ ...opts, maxTokens, temperature }, cfg.apiKey, cfg.model);
    case "openrouter":
      return callOpenRouter({ ...opts, maxTokens, temperature }, cfg.apiKey, cfg.model);
  }
}

export async function getCurrentProvider(): Promise<AIProvider | null> {
  const cfg = await getAIConfig();
  return cfg?.provider ?? null;
}

async function callAnthropic(
  opts: GenerateOptions & { maxTokens: number },
  apiKey: string,
  model: string
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
      ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const blocks = Array.isArray(data.content) ? data.content : [];
  return blocks
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");
}

async function callOpenAI(
  opts: GenerateOptions & { maxTokens: number },
  apiKey: string,
  model: string
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      max_completion_tokens: opts.maxTokens,
      ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((p: { type: string }) => p.type === "text" || p.type === "output_text")
      .map((p: { text?: string }) => p.text ?? "")
      .join("");
  }
  return "";
}

async function callOpenRouter(
  opts: GenerateOptions & { maxTokens: number },
  apiKey: string,
  model: string
): Promise<string> {
  const referer =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": referer,
      "X-Title": "SEO Audit App",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.user },
      ],
      max_tokens: opts.maxTokens,
      ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((p: { type: string }) => p.type === "text")
      .map((p: { text?: string }) => p.text ?? "")
      .join("");
  }
  return "";
}

async function callGemini(
  opts: GenerateOptions & { maxTokens: number },
  apiKey: string,
  model: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: opts.system }] },
      contents: [{ role: "user", parts: [{ text: opts.user }] }],
      generationConfig: {
        maxOutputTokens: opts.maxTokens,
        ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts.map((p: { text?: string }) => p.text ?? "").join("");
}
