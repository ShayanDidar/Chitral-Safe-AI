/**
 * Browser-side calls to this app's own API routes. Secrets stay on the server.
 */
import type { AIContext, AIMode, ChatMessage, RiskAssessment, WeatherData } from "@/types";

export async function fetchWeather(): Promise<WeatherData> {
  const res = await fetch("/api/weather", { cache: "no-store" });
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  return res.json();
}

export async function askAssistant(
  messages: ChatMessage[],
  context: AIContext | null,
): Promise<{ reply: string; mode: AIMode; notice?: string }> {
  const res = await fetch("/api/ai/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages, context }),
  });
  if (!res.ok) throw new Error(`Assistant request failed (${res.status})`);
  return res.json();
}

export async function requestRiskAnalysis(
  context: AIContext | null,
  scope: string | null,
): Promise<{ assessment: RiskAssessment; mode: AIMode }> {
  const res = await fetch("/api/ai/risk", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ context, scope }),
  });
  if (!res.ok) throw new Error(`Risk analysis failed (${res.status})`);
  return res.json();
}
