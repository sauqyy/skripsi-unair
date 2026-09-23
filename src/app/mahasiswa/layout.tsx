import { requireRole } from "@/lib/require-role";
import { DashboardShell, type NavItem } from "@/components/dashboard-shell";

const navItems: NavItem[] = [
  { href: "/mahasiswa", label: "Dashboard" },
  { href: "/mahasiswa/skripsi", label: "Data Skripsi" },
  { href: "/mahasiswa/dokumen", label: "Dokumen PDF" },
  { href: "/mahasiswa/bimbingan", label: "Bimbingan" },
];

export default async function MahasiswaLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("mahasiswa");

  return (
    <DashboardShell profile={profile} navItems={navItems}>
      {children}
    </DashboardShell>
  );
}
