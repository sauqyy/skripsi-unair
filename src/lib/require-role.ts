import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/get-current-profile";
import type { Profile, UserRole } from "@/types/database";

/**
 * Server-side guard for a role area's layout.tsx. Redirects to /login if not
 * signed in, /pending if not yet approved, or the caller's own dashboard if
 * they hold a different role than the area they tried to open.
 */
export async function requireRole(role: UserRole): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.status !== "active") redirect("/pending");
  if (profile.role !== role) redirect(`/${profile.role}`);

  return profile;
}
