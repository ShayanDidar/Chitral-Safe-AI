/** Small helpers shared by API route handlers (server-only). */
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
  ) {
    super(message ?? code);
  }
}

export const badRequest = (code: string, message?: string) => new HttpError(400, code, message);
export const unauthorized = () => new HttpError(401, "unauthorized", "Please sign in.");
export const forbidden = () => new HttpError(403, "forbidden", "You don't have permission to do this.");
export const notFound = () => new HttpError(404, "not_found", "Not found.");

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/**
 * Wraps a route handler: rejects cross-site mutations and turns thrown
 * HttpErrors / validation errors into JSON responses.
 */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD") assertSameOrigin(req);
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) {
        return Response.json({ error: err.code, message: err.message }, { status: err.status });
      }
      if (err instanceof ZodError) {
        return Response.json(
          { error: "invalid_input", message: err.issues[0]?.message ?? "Invalid input.", issues: err.issues },
          { status: 400 },
        );
      }
      console.error("[api]", req.method, new URL(req.url).pathname, err);
      return Response.json({ error: "server_error", message: "Something went wrong." }, { status: 500 });
    }
  };
}

/** CSRF protection: state-changing requests must come from this site. */
function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return; // non-browser clients (no ambient cookies from other sites)
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw forbidden();
  }
  if (!host || originHost !== host) throw new HttpError(403, "bad_origin", "Cross-site request blocked.");
}

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter (per server instance). Good enough to slow
// down brute-force attempts; use a shared store (e.g. Upstash) for scale.

const buckets = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return;
  }
  b.count++;
  if (b.count > limit) throw new HttpError(429, "rate_limited", "Too many attempts. Please wait a moment and try again.");
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
