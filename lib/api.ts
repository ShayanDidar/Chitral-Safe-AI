/**
 * Browser-side calls to this app's own API routes. Secrets stay on the server;
 * permissions are enforced there too — the UI only mirrors them.
 */
import type {
  AIContext,
  AIMode,
  ChatMessage,
  CurrentUser,
  EmergencyContact,
  Report,
  RiskAssessment,
  WeatherData,
} from "@/types";
import type { Lang } from "@/lib/i18n/terms";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    cache: "no-store",
    ...init,
    headers: init?.body instanceof FormData ? init?.headers : { "content-type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "error", data.message ?? `Request failed (${res.status})`);
  return data as T;
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

// ---- Auth & profile --------------------------------------------------------
export const fetchMe = () => api<{ user: CurrentUser | null }>("/api/auth/me").then((r) => r.user);
export const signup = (b: { name: string; email: string; password: string }) => api("/api/auth/signup", json("POST", b));
export const login = (b: { email: string; password: string }) => api("/api/auth/login", json("POST", b));
export const logout = () => api("/api/auth/logout", json("POST"));
export const demoLogin = (account: "admin" | "user") => api("/api/auth/demo", json("POST", { account }));
export const updateProfile = (b: { name: string; bio: string; phone: string; contactEmail: string }) =>
  api<{ user: CurrentUser }>("/api/profile", json("PATCH", b)).then((r) => r.user);
export const uploadAvatar = (file: Blob) => {
  const fd = new FormData();
  fd.append("avatar", file, "avatar.jpg");
  return api<{ user: CurrentUser }>("/api/profile/avatar", { method: "POST", body: fd }).then((r) => r.user);
};
export const removeAvatar = () => api<{ user: CurrentUser }>("/api/profile/avatar", json("DELETE")).then((r) => r.user);

// ---- Reports ---------------------------------------------------------------
export const fetchPublicReports = () => api<{ reports: Report[] }>("/api/reports").then((r) => r.reports);
export const fetchReport = (id: string) => api<{ report: Report }>(`/api/reports/${encodeURIComponent(id)}`).then((r) => r.report);
export const fetchMyReports = () => api<{ reports: Report[] }>("/api/me/reports").then((r) => r.reports);
export const createReport = (fd: FormData) =>
  api<{ report: Report }>("/api/reports", { method: "POST", body: fd }).then((r) => r.report);
export const deleteReport = (id: string) => api(`/api/reports/${encodeURIComponent(id)}`, json("DELETE"));
export const toggleLike = (id: string) => api<{ liked: boolean }>(`/api/reports/${id}/like`, json("POST"));
export const addComment = (id: string, text: string) =>
  api<{ report: Report }>(`/api/reports/${id}/comments`, json("POST", { text })).then((r) => r.report);

// ---- Admin -----------------------------------------------------------------
export type AdminFilter = { review: string; kind: string; visibility: string };
export const fetchAdminReports = (f: AdminFilter) =>
  api<{ reports: Report[]; counts: Partial<Record<Report["review"], number>> }>(
    `/api/admin/reports?${new URLSearchParams(f)}`,
  );
export const restoreDemoReports = () => api<{ changed: number }>("/api/admin/demo-data", json("POST")).then((r) => r.changed);
export const reviewReport = (id: string, action: "approve" | "reject", reason?: string) =>
  api<{ report: Report }>(`/api/admin/reports/${id}`, json("PATCH", { action, reason })).then((r) => r.report);

export type ContactInput = Omit<EmergencyContact, "id">;
export const fetchContacts = () => api<{ contacts: EmergencyContact[] }>("/api/emergency-contacts").then((r) => r.contacts);
export const fetchAllContacts = () => api<{ contacts: EmergencyContact[] }>("/api/admin/contacts").then((r) => r.contacts);
export const createContact = (c: ContactInput) =>
  api<{ contact: EmergencyContact }>("/api/admin/contacts", json("POST", c)).then((r) => r.contact);
export const updateContact = (id: string, c: ContactInput) =>
  api<{ contact: EmergencyContact }>(`/api/admin/contacts/${id}`, json("PATCH", c)).then((r) => r.contact);
export const deleteContact = (id: string) => api(`/api/admin/contacts/${id}`, json("DELETE"));

// ---- Weather & AI ----------------------------------------------------------
export async function fetchWeather(point?: { lat: number; lng: number; name: string }): Promise<WeatherData> {
  const qs = point ? `?${new URLSearchParams({ lat: String(point.lat), lng: String(point.lng), name: point.name })}` : "";
  return api<WeatherData>(`/api/weather${qs}`);
}

export async function askAssistant(
  messages: ChatMessage[],
  context: AIContext | null,
  lang: Lang = "en",
): Promise<{ reply: string; mode: AIMode; notice?: string }> {
  return api("/api/ai/chat", json("POST", { messages, context, lang }));
}

export async function requestRiskAnalysis(
  context: AIContext | null,
  scope: string | null,
  lang: Lang = "en",
): Promise<{ assessment: RiskAssessment; mode: AIMode }> {
  return api("/api/ai/risk", json("POST", { context, scope, lang }));
}
