import { prisma } from "@/lib/db";

export type AIProvider = "anthropic" | "openai" | "gemini" | "openrouter";

export const AI_PROVIDERS: AIProvider[] = [
  "anthropic",
  "openai",
  "gemini",
  "openrouter",
];

export const DEFAULT_MODELS: Record<AIProvider, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-5",
  gemini: "gemini-2.5-pro",
  openrouter: "anthropic/claude-sonnet-4.5",
};

export const PROVIDER_LABELS: Record<AIProvider, string> = {
  anthropic: "Anthropic Claude",
  openai: "OpenAI",
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
};

const KEYS = {
  provider: "ai_provider",
  apiKey: (p: AIProvider) => `ai_${p}_api_key`,
  model: (p: AIProvider) => `ai_${p}_model`,
} as const;

async function readSetting(key: string): Promise<string | null> {
  const row = await prisma.settings.findUnique({ where: { key } });
  return row?.value || null;
}

async function writeSetting(key: string, value: string): Promise<void> {
  await prisma.settings.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

function isProvider(value: string | null): value is AIProvider {
  return (
    value === "anthropic" ||
    value === "openai" ||
    value === "gemini" ||
    value === "openrouter"
  );
}

export interface AIResolvedConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  source: "db" | "env";
}

// Read env fallback per provider
function envKeyFor(provider: AIProvider): string {
  switch (provider) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY || "";
    case "openai":
      return process.env.OPENAI_API_KEY || "";
    case "gemini":
      return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || "";
    case "openrouter":
      return process.env.OPENROUTER_API_KEY || "";
  }
}

export async function getAIConfig(): Promise<AIResolvedConfig | null> {
  const dbProvider = await readSetting(KEYS.provider);
  const provider: AIProvider = isProvider(dbProvider) ? dbProvider : "anthropic";

  const dbKey = await readSetting(KEYS.apiKey(provider));
  const apiKey = dbKey || envKeyFor(provider);
  if (!apiKey) return null;

  const dbModel = await readSetting(KEYS.model(provider));
  const model = dbModel || DEFAULT_MODELS[provider];

  return {
    provider,
    apiKey,
    model,
    source: dbKey ? "db" : "env",
  };
}

export interface AIConfigStatus {
  provider: AIProvider;
  configuredProviders: AIProvider[];
  model: string;
  modelOverride: boolean;
  keyPreview: string | null;
  source: "db" | "env" | null;
  configured: boolean;
  // per-provider: which have saved keys (DB) — lets UI show multiple check marks
  savedKeys: Record<AIProvider, boolean>;
  envKeysDetected: Record<AIProvider, boolean>;
}

function previewKey(key: string): string {
  if (!key) return "";
  if (key.length <= 10) return "•".repeat(key.length);
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

export async function getAIConfigStatus(): Promise<AIConfigStatus> {
  const dbProvider = await readSetting(KEYS.provider);
  const provider: AIProvider = isProvider(dbProvider) ? dbProvider : "anthropic";

  const savedKeys: Record<AIProvider, boolean> = {
    anthropic: false,
    openai: false,
    gemini: false,
    openrouter: false,
  };
  for (const p of AI_PROVIDERS) {
    savedKeys[p] = Boolean(await readSetting(KEYS.apiKey(p)));
  }

  const envKeysDetected: Record<AIProvider, boolean> = {
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    gemini: Boolean(
      process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY
    ),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY),
  };

  const configuredProviders = AI_PROVIDERS.filter(
    (p) => savedKeys[p] || envKeysDetected[p]
  );

  const dbKey = await readSetting(KEYS.apiKey(provider));
  const resolvedKey = dbKey || envKeyFor(provider);
  const dbModel = await readSetting(KEYS.model(provider));
  const model = dbModel || DEFAULT_MODELS[provider];

  return {
    provider,
    configuredProviders,
    model,
    modelOverride: Boolean(dbModel),
    keyPreview: resolvedKey ? previewKey(resolvedKey) : null,
    source: resolvedKey ? (dbKey ? "db" : "env") : null,
    configured: Boolean(resolvedKey),
    savedKeys,
    envKeysDetected,
  };
}

export async function saveAIConfig(input: {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
}): Promise<void> {
  const tasks: Promise<unknown>[] = [writeSetting(KEYS.provider, input.provider)];
  if (input.apiKey && input.apiKey.trim()) {
    tasks.push(writeSetting(KEYS.apiKey(input.provider), input.apiKey.trim()));
  }
  if (input.model !== undefined) {
    const trimmed = input.model.trim();
    // empty string -> clear override
    if (trimmed === "") {
      tasks.push(
        prisma.settings
          .delete({ where: { key: KEYS.model(input.provider) } })
          .catch(() => undefined)
      );
    } else {
      tasks.push(writeSetting(KEYS.model(input.provider), trimmed));
    }
  }
  await Promise.all(tasks);
}

export async function clearAIProviderKey(provider: AIProvider): Promise<void> {
  await Promise.all([
    prisma.settings
      .delete({ where: { key: KEYS.apiKey(provider) } })
      .catch(() => undefined),
    prisma.settings
      .delete({ where: { key: KEYS.model(provider) } })
      .catch(() => undefined),
  ]);
}
