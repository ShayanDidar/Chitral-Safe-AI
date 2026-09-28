import { chat } from "@/services/aiService";
import type { AIContext, ChatMessage } from "@/types";

export async function POST(request: Request) {
  let body: { messages?: ChatMessage[]; context?: AIContext | null; lang?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "A user message is required" }, { status: 400 });
  }

  const context = body.context && JSON.stringify(body.context).length < 40_000 ? body.context : null;
  const result = await chat(messages, context, body.lang === "ur" ? "ur" : "en");
  return Response.json(result);
}
