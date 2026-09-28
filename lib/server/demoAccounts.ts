/**
 * One-click demo accounts for exhibitions and testing (server-only).
 * Anyone can use them while enabled — turn off with DEMO_LOGIN=false
 * before handling real reports.
 */
export const DEMO_ACCOUNTS = {
  admin: { email: "demo-admin@chitralsafe.test", name: "Demo Admin", role: "admin" },
  user: { email: "demo-reporter@chitralsafe.test", name: "Demo Reporter", role: "user" },
} as const;

export type DemoAccount = keyof typeof DEMO_ACCOUNTS;

export const demoLoginEnabled = () => process.env.DEMO_LOGIN !== "false";
