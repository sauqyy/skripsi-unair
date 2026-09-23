import { requireRole } from "@/lib/require-role";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";

const navItems: NavItem[] = [
  { href: "/dosen", label: "Dashboard" },
  { href: "/dosen/mahasiswa", label: "Mahasiswa Bimbingan" },
  { href: "/dosen/settings", label: "Settings" },
];

export default async function DosenLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("dosen");

  return (
    <DashboardShell profile={profile} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
