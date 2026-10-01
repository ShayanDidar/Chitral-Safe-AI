import { analyzeRisk } from "@/lib/server/ai";
import type { AIContext } from "@/types";

export async function POST(request: Request) {
  let body: { context?: AIContext | null; scope?: string | null; lang?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const context = body.context && JSON.stringify(body.context).length < 40_000 ? body.context : null;
  const scope = typeof body.scope === "string" && body.scope.length < 80 ? body.scope : null;
  const result = await analyzeRisk(context, scope, body.lang === "ur" ? "ur" : "en");
  return Response.json(result);
}
