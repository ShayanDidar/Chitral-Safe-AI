import { redirect } from "next/navigation";
import { currentUserOrNull } from "@/lib/server/auth";

/** Account pages require a signed-in user (checked on the server). */
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const user = await currentUserOrNull();
  if (!user) redirect("/login?next=/account");
  return children;
}
