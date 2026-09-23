import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Profile } from "@/types/database";
import { NotificationBell } from "@/components/notification-bell";
import { NavLink } from "@/components/nav-link";
import { LogoMark } from "@/components/logo-mark";

export interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

const roleLabel: Record<Profile["role"], string> = {
  koordinator: "Koordinator",
  dosen: "Dosen Pembimbing",
  mahasiswa: "Mahasiswa",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

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
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
          <LogoMark />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">Monitoring Skripsi</p>
            <p className="truncate text-xs text-slate-500">{roleLabel[profile.role]}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href} label={item.label} exact={item.exact} />
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3M16 17l4-5-4-5M20 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <LogoMark className="h-8 w-8" />
            <p className="text-sm font-semibold text-slate-900">{roleLabel[profile.role]}</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <NotificationBell userId={profile.id} />
            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{profile.nama}</p>
                <p className="text-xs text-slate-500">{profile.email}</p>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                {initials(profile.nama) || "?"}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
