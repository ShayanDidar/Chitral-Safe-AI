import { getCurrentUser } from "@/lib/server/auth";
import { route } from "@/lib/server/http";
import { toCurrentUser } from "@/lib/server/users";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await getCurrentUser();
  return Response.json({ user: user ? toCurrentUser(user) : null });
});
