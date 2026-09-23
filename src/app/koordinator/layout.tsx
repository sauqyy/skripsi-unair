import { requireRole } from "@/lib/require-role";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";

const navItems: NavItem[] = [
  { href: "/koordinator", label: "Dashboard" },
  { href: "/koordinator/verifikasi", label: "Verifikasi Akun" },
  { href: "/koordinator/assignment", label: "Assignment Bimbingan" },
  { href: "/koordinator/mahasiswa", label: "Mahasiswa" },
  { href: "/koordinator/tahapan", label: "Tahapan Skripsi" },
];

export default async function KoordinatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("koordinator");

  return (
    <DashboardShell profile={profile} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
