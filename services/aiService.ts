/**
 * AI service (server-side only — used by app/api/ai/* route handlers, so the
 * API key never reaches the browser).
 *
 * Configure with environment variables (see .env.example):
 *   AI_API_KEY   — your key. If missing, realistic demo responses are used.
 *   AI_PROVIDER  — "anthropic" or "openai" (any OpenAI-compatible API: OpenAI,
 *                  Groq, OpenRouter, Together, Google Gemini's OpenAI endpoint…).
 *                  Auto-detected from the key when omitted.
 *   AI_MODEL     — model name (optional for Anthropic).
 *   AI_BASE_URL  — base URL for OpenAI-compatible providers.
 */
import { demoChat, demoRisk } from "@/lib/ai/demo";
import { formatContext, RISK_INSTRUCTIONS, SYSTEM_PROMPT } from "@/lib/ai/systemPrompt";
import type { AIContext, AIMode, ChatMessage, RiskAssessment, RiskLevel } from "@/types";

interface AIConfig {
  provider: "anthropic" | "openai";
  apiKey: string;
  model: string;
  baseUrl: string;
}

export function getAIConfig(): AIConfig | null {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) return null;
  const provider =
    (process.env.AI_PROVIDER?.trim().toLowerCase() as AIConfig["provider"] | undefined) ||
    (apiKey.startsWith("sk-ant-") ? "anthropic" : "openai");
  if (provider === "anthropic") {
    return {
      provider,
      apiKey,
      model: process.env.AI_MODEL?.trim() || "claude-sonnet-5",
      baseUrl: (process.env.AI_BASE_URL?.trim() || "https://api.anthropic.com").replace(/\/$/, ""),
    };
  }
  return {
    provider: "openai",
    apiKey,
    model: process.env.AI_MODEL?.trim() || "gpt-4o-mini",
    baseUrl: (process.env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, ""),
  };
}

export interface ChatResult {
  reply: string;
  mode: AIMode;
  notice?: string;
}

export async function chat(messages: ChatMessage[], context: AIContext | null): Promise<ChatResult> {
  const config = getAIConfig();
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  if (!config) {
    await new Promise((r) => setTimeout(r, 700)); // feel natural in demos
    return { reply: demoChat(lastUser, context), mode: "demo" };
  }

  try {
    const system = `${SYSTEM_PROMPT}\n\n${formatContext(context)}`;
    const reply = await complete(config, system, messages, 900);
    return { reply: reply.trim() || demoChat(lastUser, context), mode: "live" };
  } catch (err) {
    console.error("[aiService] chat failed, falling back to demo:", err);
    return {
      reply: demoChat(lastUser, context),
      mode: "demo",
      notice: "The AI provider could not be reached, so a demo response is shown.",
    };
  }
}

export interface RiskResult {
  assessment: RiskAssessment;
  mode: AIMode;
}

export async function analyzeRisk(context: AIContext | null, scope: string | null): Promise<RiskResult> {
  const fallback = demoRisk(context, scope);
  const config = getAIConfig();
  if (!config) return { assessment: fallback, mode: "demo" };

  try {
    const system = `${SYSTEM_PROMPT}\n\n${formatContext(context)}`;
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
    console.error("[aiService] risk analysis failed, falling back to demo:", err);
    return { assessment: fallback, mode: "demo" };
  }
}

// ---------------------------------------------------------------------------

async function complete(config: AIConfig, system: string, messages: ChatMessage[], maxTokens: number): Promise<string> {
  const signal = AbortSignal.timeout(30_000);

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
