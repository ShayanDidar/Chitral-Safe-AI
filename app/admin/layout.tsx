import { redirect } from "next/navigation";
import { currentUserOrNull } from "@/lib/server/auth";
import { AdminShell, NotAuthorized } from "@/components/admin/AdminShell";

/**
 * Admin pages: signed-out visitors go to sign in; signed-in non-admins see a
 * "not authorised" message. The admin API routes enforce the same rule
 * independently, so hiding the UI is never the only protection.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await currentUserOrNull();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") return <NotAuthorized />;
  return <AdminShell>{children}</AdminShell>;
}
