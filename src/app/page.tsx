import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/get-current-profile";

export default async function HomePage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.status !== "active") redirect("/pending");
  redirect(`/${profile.role}`);
}
