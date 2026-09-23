import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";
import { NotificationBell } from "@/components/notification-bell";

export interface NavItem {
  href: string;
  label: string;
}

const roleLabel: Record<Profile["role"], string> = {
  koordinator: "Koordinator",
  dosen: "Dosen Pembimbing",
  mahasiswa: "Mahasiswa",
};

export function DashboardShell({
  profile,
  navItems,
  children,
}: {
  profile: Profile;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">Monitoring Skripsi</p>
          <p className="text-xs text-slate-500">{roleLabel[profile.role]}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:px-6">
          <p className="text-sm text-slate-500 md:hidden">{roleLabel[profile.role]}</p>
          <div className="ml-auto flex items-center gap-4">
            <NotificationBell userId={profile.id} />
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{profile.nama}</p>
              <p className="text-xs text-slate-500">{profile.email}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
