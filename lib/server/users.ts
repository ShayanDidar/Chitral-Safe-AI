import type { CurrentUser } from "@/types";
import type { SessionUser } from "./auth";
import { imageUrl } from "./reports";

/** The signed-in user's own profile (includes their private contact details). */
export function toCurrentUser(u: SessionUser): CurrentUser {
  return {
    id: u.id,
    email: u.email,
    role: u.role === "admin" ? "admin" : "user",
    name: u.name,
    bio: u.bio,
    phone: u.phone,
    contactEmail: u.contactEmail,
    avatarUrl: u.avatarImageId ? imageUrl(u.avatarImageId) : null,
  };
}
