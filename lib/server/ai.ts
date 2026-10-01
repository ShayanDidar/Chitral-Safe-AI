/**
 * AI service (server-side only — used by app/api/ai/* route handlers, so the
 * API key never reaches the browser).
 *
 * Configure with environment variables (see .env.example):
 *   AI_API_KEY   — your key. If missing, realistic demo responses are used.
 *   AI_PROVIDER  — "anthropic" or "openai" (any OpenAI-compatible API: OpenAI,
 *                  Groq, OpenRouter, Together, Google Gemini's OpenAI endpoint…).
 *                  Auto-detected from the key when omitted; Google Gemini keys
 *                  are routed to Gemini automatically.
 *   AI_MODEL     — model name (optional for Anthropic).
 *   AI_BASE_URL  — base URL for OpenAI-compatible providers.
 */
import { demoChat, demoRisk } from "@/lib/ai/demo";
import { formatContext, languageInstruction, RISK_INSTRUCTIONS, SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";
import type { Lang } from "@/lib/i18n/terms";
import type { AIContext, AIMode, ChatMessage, RiskAssessment, RiskLevel } from "@/types";

interface AIConfig {
  provider: "anthropic" | "openai";
  apiKey: string;
  model: string;
  /** Tried in order when a model is overloaded or unavailable. */
  fallbackModels: string[];
  baseUrl: string;
}

const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

function getAIConfig(): AIConfig | null {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) return null;
  // Google Gemini keys ("AIza…" or "AQ.…") use Gemini's OpenAI-compatible endpoint.
  const isGemini = apiKey.startsWith("AIza") || apiKey.startsWith("AQ.");
  const provider =
    (process.env.AI_PROVIDER?.trim().toLowerCase() as AIConfig["provider"] | undefined) ||
    (apiKey.startsWith("sk-ant-") ? "anthropic" : "openai");
  if (provider === "anthropic") {
    return {
      provider,
      apiKey,
      model: process.env.AI_MODEL?.trim() || "claude-sonnet-5",
      fallbackModels: [],
      baseUrl: (process.env.AI_BASE_URL?.trim() || "https://api.anthropic.com").replace(/\/$/, ""),
    };
  }
  return {
    provider: "openai",
    apiKey,
    model: process.env.AI_MODEL?.trim() || (isGemini ? GEMINI_MODELS[0] : "gpt-4o-mini"),
    fallbackModels: isGemini ? GEMINI_MODELS.filter((m) => m !== process.env.AI_MODEL?.trim()) : [],
    baseUrl: (
      process.env.AI_BASE_URL?.trim() ||
      (isGemini ? "https://generativelanguage.googleapis.com/v1beta/openai" : "https://api.openai.com/v1")
    ).replace(/\/$/, ""),
  };
}

export interface ChatResult {
  reply: string;
  mode: AIMode;
  notice?: string;
}

export async function chat(messages: ChatMessage[], context: AIContext | null, lang: Lang = "en"): Promise<ChatResult> {
  const config = getAIConfig();
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  if (!config) {
    await new Promise((r) => setTimeout(r, 700)); // feel natural in demos
    return { reply: demoChat(lastUser, context, lang), mode: "demo" };
  }

  try {
    const system = `${SYSTEM_PROMPT}\n\n${languageInstruction(lang)}\n\n${formatContext(context)}`;
    const reply = await complete(config, system, messages, 900);
    return { reply: reply.trim() || demoChat(lastUser, context, lang), mode: "live" };
  } catch (err) {
    console.error("[ai] chat failed, falling back to demo:", err);
    return {
      reply: demoChat(lastUser, context, lang),
      mode: "demo",
      notice: "provider_unreachable",
    };
  }
}

export interface RiskResult {
  assessment: RiskAssessment;
  mode: AIMode;
}

export async function analyzeRisk(
  context: AIContext | null,
  scope: string | null,
  lang: Lang = "en",
): Promise<RiskResult> {
  const fallback = demoRisk(context, scope, lang);
  const config = getAIConfig();
  if (!config) return { assessment: fallback, mode: "demo" };

  try {
    const system = `${SYSTEM_PROMPT}\n\n${languageInstruction(lang)}\n\n${formatContext(context)}`;
    const prompt = `${RISK_INSTRUCTIONS}\n\nScope: ${scope ?? "All of Chitral"}`;
    const text = await complete(config, system, [{ role: "user", content: prompt }], 500);
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    const levels: RiskLevel[] = ["Low", "Moderate", "High", "Severe"];
    return {
      mode: "live",
      assessment: {
        level: levels.includes(json.level) ? json.level : fallback.level,
        score: Number.isFinite(json.score) ? Math.max(0, Math.min(100, Math.round(json.score))) : fallback.score,
        headline: String(json.headline || fallback.headline),
        possibleRisks: Array.isArray(json.possibleRisks) ? json.possibleRisks.map(String).slice(0, 5) : fallback.possibleRisks,
        reason: String(json.reason || fallback.reason),
        suggestedAction: String(json.suggestedAction || fallback.suggestedAction),
        scope: fallback.scope,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error("[ai] risk analysis failed, falling back to demo:", err);
    return { assessment: fallback, mode: "demo" };
  }
}

// ---------------------------------------------------------------------------

/**
 * Calls the configured model; on rate-limit, overload or "model not found"
 * errors it moves on to the next fallback model (hosted models are often busy).
 */
async function complete(config: AIConfig, system: string, messages: ChatMessage[], maxTokens: number): Promise<string> {
  const models = [config.model, ...config.fallbackModels.filter((m) => m !== config.model)];
  let lastError: unknown;
  for (const model of models) {
    try {
      return await completeOnce({ ...config, model }, system, messages, maxTokens);
    } catch (err) {
      lastError = err;
      const retryable = err instanceof Error && /HTTP (404|429|500|502|503|504)|timeout|aborted/i.test(err.message + err.name);
      if (!retryable) break;
      console.warn(`[ai] ${model} unavailable, trying next model`);
    }
  }
  throw lastError;
}

async function completeOnce(config: AIConfig, system: string, messages: ChatMessage[], maxTokens: number): Promise<string> {
  const signal = AbortSignal.timeout(20_000);

  if (config.provider === "anthropic") {
    const res = await fetch(`${config.baseUrl}/v1/messages`, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: config.model, max_tokens: maxTokens, system, messages }),
    });
    if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    return (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  }

  const res = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json", authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!res.ok) throw new Error(`AI HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}
