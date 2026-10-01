/**
 * One-click demo accounts for exhibitions and testing (server-only).
 * Anyone can use them while enabled — turn off with DEMO_LOGIN=false
 * before handling real reports.
 */
export const DEMO_ACCOUNTS = {
  admin: { email: "admin@chitralsafe.test", name: "Admin", role: "admin" },
  user: { email: "user@chitralsafe.test", name: "User", role: "user" },
} as const;

export const demoLoginEnabled = () => process.env.DEMO_LOGIN !== "false";
